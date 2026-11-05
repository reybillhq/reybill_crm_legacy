"""Run the unmodified upstream Press validators in an isolated, read-only harness.

Run with the bench Python (requests is required). No Press database is accessed.
Only function definitions are loaded; OAuth, decorators and service startup are
excluded. GitHub I/O is supplied locally, or uses the public API with --live.
Downloaded Press source retains its original notices and is never redistributed.
"""

import argparse
import ast
import base64
import contextlib
import hashlib
import json
import re
import subprocess
from pathlib import Path
from types import SimpleNamespace
from urllib.request import urlopen

import requests

try:
	import tomllib as tomli
except ImportError:
	import tomli


PRESS_COMMIT = "4088700ce2bd6bdc39a7f8c39206f86d8ae9226b"
PRESS_SOURCE_SHA256 = {
	"press/api/github.py": "c8bcd7b094cb0a5563892f8afdecbeacfc058aa7b148fde98ad3cffa3e7ecbac",
	"press/press/doctype/release_group/release_group.py": "0a5ea8ff8b5156818539e0e1661f8a7fb406aeda132a2825abf76f94b84d2e2b",
}
ROOT = Path(__file__).resolve().parents[1]


class ValidationError(Exception):
	pass


def throw(message, *args):
	raise ValidationError(message)


def load_functions(source, names, namespace):
	"""Compile original function bodies, removing only service decorators."""
	tree = ast.parse(source)
	functions = []
	for node in ast.walk(tree):
		if isinstance(node, ast.FunctionDef) and node.name in names:
			node.decorator_list = []
			functions.append(node)
	assert {node.name for node in functions} == set(names)
	exec(compile(ast.Module(body=functions, type_ignores=[]), "<pinned-press>", "exec"), namespace)


class LocalGitHub:
	"""GitHub API-shaped repository responses; validation stays in Press code."""

	def __init__(self, ref):
		self.ref = ref

	def git(self, *args):
		return subprocess.check_output(["git", "-C", str(ROOT), *args])

	def get(self, url, **kwargs):
		if "/branches/" in url:
			data = {"name": self.ref, "commit": {"commit": {"tree": {"sha": "local"}}}}
		elif "/git/trees/" in url:
			if self.ref == "WORKTREE":
				files = self.git("ls-files").decode().splitlines()
			else:
				files = self.git("ls-tree", "-r", "--name-only", self.ref).decode().splitlines()
			paths = set(files)
			for filename in files:
				paths.update(str(parent) for parent in Path(filename).parents if str(parent) != ".")
			data = {"tree": [{"path": path} for path in sorted(paths)]}
		elif "/contents/" in url:
			path = url.split("/contents/", 1)[1]
			content = (
				(ROOT / path).read_bytes()
				if self.ref == "WORKTREE"
				else self.git("show", f"{self.ref}:{path}")
			)
			data = {"content": base64.b64encode(content).decode()}
		else:
			raise AssertionError(url)
		return SimpleNamespace(ok=True, json=lambda: data)


def main():
	parser = argparse.ArgumentParser(description=__doc__)
	parser.add_argument(
		"--press-source", type=Path, help="Directory containing downloaded press/api/github.py"
	)
	parser.add_argument("--live", action="store_true", help="Also validate the published branch via GitHub")
	parser.add_argument("--branch", default="release/v0.0.2")
	args = parser.parse_args()
	paths = ("press/api/github.py", "press/press/doctype/release_group/release_group.py")
	sources = {}
	for path in paths:
		if args.press_source:
			source = (args.press_source / path).read_bytes()
		else:
			url = f"https://raw.githubusercontent.com/frappe/press/{PRESS_COMMIT}/{path}"
			with urlopen(url, timeout=30) as response:
				source = response.read()
		assert hashlib.sha256(source).hexdigest() == PRESS_SOURCE_SHA256[path], path
		sources[path] = source

	namespace = {
		"frappe": SimpleNamespace(
			throw=throw, bold=str, _dict=lambda data: SimpleNamespace(**data), ValidationError=ValidationError
		),
		"get_auth_headers": lambda installation: {},
		"Path": Path,
		"re": re,
		"b64decode": base64.b64decode,
		"contextlib": contextlib,
		"tomli": tomli,
		"docs": SimpleNamespace(CUSTOM_APP="", doc_link=lambda *args: ""),
	}
	load_functions(
		sources[paths[0]],
		(
			"app",
			"_get_app_name_and_title_from_hooks",
			"_get_compatible_frappe_version_from_pyproject",
			"_generate_files_tree",
			"_construct_tree",
		),
		namespace,
	)
	load_functions(sources[paths[1]], ("validate_duplicate_app",), namespace)

	results = {
		"press_commit": PRESS_COMMIT,
		"source_sha256": {path: hashlib.sha256(source).hexdigest() for path, source in sources.items()},
	}
	namespace["requests"] = LocalGitHub("v0.0.1")
	try:
		namespace["app"]("reybillhq", "reybill_crm", "v0.0.1")
	except ValidationError as exc:
		assert "hooks.py does not have app_title defined" in str(exc), str(exc)
		results["published_v0.0.1_reproduced_error"] = str(exc)
	else:
		raise AssertionError("The legacy release should reproduce the reported failure")

	namespace["requests"] = LocalGitHub("WORKTREE")
	metadata = namespace["app"]("reybillhq", "reybill_crm", "WORKTREE")
	assert metadata == {"name": "crm", "title": "ReyBill CRM", "frappe_version": ">=15.0.0,<17.0.0"}
	results["local_metadata"] = metadata
	try:
		namespace["validate_duplicate_app"](
			SimpleNamespace(
				apps=[
					SimpleNamespace(app="crm"),
					SimpleNamespace(app="crm"),
				]
			)
		)
	except ValidationError as exc:
		assert str(exc) == "App crm can be added only once"
		results["duplicate_crm_rejected"] = str(exc)
	else:
		raise AssertionError("Press must reject two crm entries")
	namespace["validate_duplicate_app"](
		SimpleNamespace(
			apps=[
				SimpleNamespace(app="frappe"),
				SimpleNamespace(app="crm"),
			]
		)
	)
	results["single_replacement_crm_accepted"] = True
	if args.live:
		namespace["requests"] = requests
		live = namespace["app"]("reybillhq", "reybill_crm", args.branch)
		assert live == metadata, live
		results["live_branch"] = args.branch
		results["live_metadata"] = live
	print(json.dumps(results, indent=2))


if __name__ == "__main__":
	main()
