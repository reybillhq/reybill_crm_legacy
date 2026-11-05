"""Read-only deployment identity for local verification by system managers."""

from pathlib import Path
import subprocess

import frappe


@frappe.whitelist()
def get_runtime_info() -> dict:
	frappe.only_for("System Manager")
	import crm

	source = Path(crm.__file__).resolve()
	repository = source.parents[1]

	def git_value(*arguments):
		return subprocess.check_output(
			["git", "-C", str(repository), *arguments], text=True, timeout=5
		).strip()

	return {
		"app": "crm",
		"version": crm.__version__,
		"source_path": str(source),
		"commit": git_value("rev-parse", "HEAD"),
		"branch": git_value("branch", "--show-current"),
	}
