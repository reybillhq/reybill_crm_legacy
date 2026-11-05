"""CRM-owned app icon metadata; preserve record names, routes and saved layouts."""

import frappe

from crm.branding import BRANDING

# Exact native workspace identities, never translated labels or module removal.
# ERP's redundant CRM launcher is also excluded by ReyBill Core's policy.
LEGACY_WORKSPACES = {"Frappe CRM": "crm", "CRM": "erpnext"}


def is_crm_app_icon(icon):
	return icon.get("app") == "crm" and icon.get("icon_type") == "App"


def normalize_desktop_icons(icons):
	"""Present one permitted CRM App without rewriting records or saved layouts."""
	if not isinstance(icons, list):
		return icons
	apps = [icon for icon in icons if is_crm_app_icon(icon)]
	if not apps:
		# Never manufacture permission to launch CRM or remove the only navigation.
		return icons
	canonical = next((icon for icon in apps if icon.get("hidden") not in (1, "1")), apps[0])
	visible_app = canonical.get("hidden") not in (1, "1")
	result = []
	for icon in icons:
		if is_crm_app_icon(icon):
			if icon is canonical:
				result.append({**icon, "label": BRANDING["appName"], "logo_url": BRANDING["appIcon"]})
			continue
		workspace = icon.get("link_to")
		if (
			visible_app
			and icon.get("icon_type") == "Link"
			and icon.get("link_type") == "Workspace Sidebar"
			and workspace in LEGACY_WORKSPACES
			and icon.get("name") == workspace
			and icon.get("app") == LEGACY_WORKSPACES[workspace]
		):
			continue
		result.append(icon)
	return result


def extend_bootinfo(bootinfo):
	bootinfo["crm_app_icon"] = {
		"name": BRANDING["appName"],
		"src": BRANDING["appIcon"],
		"legacy_workspaces": LEGACY_WORKSPACES,
	}
	if "desktop_icons" in bootinfo:
		bootinfo["desktop_icons"] = normalize_desktop_icons(bootinfo["desktop_icons"])


def sync_desktop_icon():
	if not frappe.db.exists("DocType", "Desktop Icon"):
		return
	values = {"label": BRANDING["appName"], "logo_url": BRANDING["appIcon"]}
	names = frappe.get_all("Desktop Icon", filters={"app": "crm", "icon_type": "App"}, pluck="name")
	for name in names:
		icon = frappe.get_doc("Desktop Icon", name)
		changed = {key: value for key, value in values.items() if icon.get(key) != value}
		if changed:
			# db_set avoids exporting standard records or rewriting user layouts.
			icon.db_set(changed)
	# Invalidate both caches, including sessions created before this hook existed.
	# extend_bootinfo also reconciles cached boot and browser-restored layouts.
	frappe.cache.delete_key("desktop_icons")
	frappe.cache.delete_key("bootinfo")
