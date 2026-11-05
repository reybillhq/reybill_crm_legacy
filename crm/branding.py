"""Customer-facing defaults. Internal app and integration identifiers stay unchanged."""
import json
from pathlib import Path

BRANDING = json.loads(Path(__file__).with_name("branding.json").read_text())
PRODUCT_NAME = BRANDING["productName"]


def sync_display_labels():
	"""Adopt owned display defaults without changing schema or customer labels."""
	import frappe

	changed = []
	for path in (Path(__file__).parent / "fcrm" / "doctype").glob("*/*.json"):
		definition = json.loads(path.read_text())
		if not isinstance(definition, dict) or definition.get("doctype") != "DocType":
			continue
		for field in definition.get("fields", []):
			label = field.get("label", "")
			if BRANDING["erpName"] not in label:
				continue
			row = frappe.db.get_value(
				"DocField", {"parent": definition["name"], "fieldname": field["fieldname"]},
				["name", "label"], as_dict=True,
			)
			if row and row.label == label.replace(BRANDING["erpName"], "ERPNext"):
				frappe.db.set_value("DocField", row.name, "label", label, update_modified=False)
				changed.append(definition["name"])
	custom_labels = {
		("CRM Deal", "erpnext_customer"): f"Customer in {BRANDING['erpName']}",
		("CRM Product", "erpnext_item_code"): f"Item Code in {BRANDING['erpName']}",
	}
	for (doctype, fieldname), label in custom_labels.items():
		row = frappe.db.get_value(
			"Custom Field", {"dt": doctype, "fieldname": fieldname}, ["name", "label"], as_dict=True,
		)
		if row and row.label == label.replace(BRANDING["erpName"], "ERPNext"):
			frappe.db.set_value("Custom Field", row.name, "label", label, update_modified=False)
			changed.append(doctype)
	# This field's upstream help action was intentionally retired in CRM source.
	row = frappe.db.get_value(
		"DocField", {"parent": "CRM Form Script", "fieldname": "script"},
		["name", "documentation_url"], as_dict=True,
	)
	if row and row.documentation_url == "https://docs.frappe.io/crm/custom-actions":
		frappe.db.set_value("DocField", row.name, "documentation_url", None, update_modified=False)
		changed.append("CRM Form Script")
	for attribute in ("label", "title"):
		value = frappe.db.get_value("Workspace", "Frappe CRM", attribute)
		if value in ("Frappe CRM", "ReyBill Sales"):
			frappe.db.set_value("Workspace", "Frappe CRM", attribute, PRODUCT_NAME, update_modified=False)
	for doctype in set(changed):
		frappe.clear_cache(doctype=doctype)
	return sorted(set(changed))
