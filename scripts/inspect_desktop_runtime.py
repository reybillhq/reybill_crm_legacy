"""Read-only operator diagnostic; run with the target bench's Python environment.

Example: env/bin/python apps/crm/scripts/inspect_desktop_runtime.py \
    --site test.example.com --sites-path sites --output /tmp/crm-desktop.json
No web endpoint, authentication bypass or database writes are introduced.
The report may contain user layout metadata: keep it private.
"""

import argparse
import hashlib
import json
import os
import subprocess
from pathlib import Path
from urllib.parse import urlsplit, urlunsplit

import frappe


def main():
	parser = argparse.ArgumentParser(description=__doc__)
	parser.add_argument("--site", required=True)
	parser.add_argument("--sites-path", type=Path, required=True)
	parser.add_argument("--output", type=Path, required=True)
	parser.add_argument(
		"--user", default="Administrator", help="User cache/layout to inspect; no session is created"
	)
	args = parser.parse_args()
	sites_path = args.sites_path.resolve()
	args.output = args.output.resolve()
	os.chdir(sites_path)
	frappe.init(args.site, sites_path=str(sites_path))
	try:
		frappe.connect(set_admin_as_user=False)
		frappe.db.begin(read_only=True)
		import crm
		from crm import hooks

		root = Path(crm.__file__).resolve().parents[1]

		def git(*arguments):
			return subprocess.check_output(
				["git", "-C", str(root), *arguments], text=True, timeout=10
			).strip()

		origin = git("remote", "get-url", "origin")
		if "://" in origin:
			parts = urlsplit(origin)
			origin = urlunsplit((parts.scheme, parts.netloc.rsplit("@", 1)[-1], parts.path, "", ""))
		report = {
			"site": frappe.local.site,
			"python_source": crm.__file__,
			"version": crm.__version__,
			"repository": origin,
			"commit": git("rev-parse", "HEAD"),
			"branch": git("branch", "--show-current"),
			"worktree_dirty": bool(git("status", "--porcelain")),
			"framework_version": frappe.__version__,
			"hooks": {
				key: getattr(hooks, key, None)
				for key in (
					"app_name",
					"app_title",
					"app_logo_url",
					"app_icon_url",
					"add_to_apps_screen",
				)
			},
			"effective_desktop_scripts": frappe.get_hooks("page_js").get("desktop", []),
			"effective_boot_extensions": frappe.get_hooks("extend_bootinfo"),
			"source_hashes": {},
		}
		for filename in (
			"crm/hooks.py",
			"crm/app_icon.py",
			"crm/public/js/desktop_crm_icon.js",
			"crm/public/images/reybill-crm.svg",
			"crm/public/frontend/legal/source.json",
		):
			path = root / filename
			report["source_hashes"][filename] = (
				hashlib.sha256(path.read_bytes()).hexdigest() if path.is_file() else None
			)
		built_source = root / "crm/public/frontend/legal/source.json"
		if built_source.is_file():
			report["built_source"] = json.loads(built_source.read_text())

		def candidates(rows):
			return [
				row
				for row in rows
				if row.get("app") == "crm" or row.get("name") in ("CRM", "Frappe CRM", "ReyBill CRM")
			]

		if frappe.db.exists("DocType", "Desktop Icon"):
			report["stored_desktop_icons"] = candidates(
				frappe.get_all(
					"Desktop Icon",
					fields=[
						"name",
						"app",
						"icon_type",
						"label",
						"link",
						"link_type",
						"link_to",
						"logo_url",
						"hidden",
						"standard",
						"parent_icon",
						"idx",
					],
				)
			)
			report["cached_desktop_icons"] = candidates(frappe.cache.hget("desktop_icons", args.user) or [])
		report["workspaces"] = frappe.get_all(
			"Workspace",
			filters={"name": ["in", ["CRM", "Frappe CRM"]]},
			fields=["name", "label", "title", "module", "app", "is_hidden", "public"],
		)
		boot = frappe.cache.hget("bootinfo", args.user) or {}
		report["cached_boot_icon_metadata"] = boot.get("crm_app_icon")
		if frappe.db.exists("DocType", "Desktop Layout"):
			layout = frappe.db.get_value("Desktop Layout", args.user, "layout")
			report["saved_layout_sha256"] = hashlib.sha256(layout.encode()).hexdigest() if layout else None
			if layout:
				report["saved_layout_crm_icons"] = candidates(json.loads(layout))
		frappe.db.rollback()
		fd = os.open(args.output, os.O_WRONLY | os.O_CREAT | os.O_TRUNC, 0o600)
		os.fchmod(fd, 0o600)
		with os.fdopen(fd, "w") as stream:
			json.dump(report, stream, indent=2, default=str)
		print(json.dumps({key: report[key] for key in ("site", "repository", "commit", "branch", "version")}))
		print(f"Private read-only report: {args.output}")
	finally:
		frappe.destroy()


if __name__ == "__main__":
	main()
