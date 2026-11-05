"""CRM-owned app icon metadata; preserve record names, routes and saved layouts."""
import frappe

from crm.branding import BRANDING


def extend_bootinfo(bootinfo):
	bootinfo.crm_app_icon = {"name": BRANDING["appName"], "src": BRANDING["appIcon"]}


def sync_desktop_icon():
	if not frappe.db.exists("DocType", "Desktop Icon"):
		return
	name = frappe.db.exists("Desktop Icon", {"app": "crm", "icon_type": "App"})
	if not name:
		return
	icon = frappe.get_doc("Desktop Icon", name)
	values = {"label": BRANDING["appName"], "logo_url": BRANDING["appIcon"]}
	changed = {key: value for key, value in values.items() if icon.get(key) != value}
	if changed:
		# db_set avoids exporting a renamed standard record or rewriting user layouts.
		icon.db_set(changed)
		frappe.cache.delete_key("desktop_icons")
