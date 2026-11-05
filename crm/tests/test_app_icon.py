"""Desktop branding repairs must preserve records, permissions and user layouts."""

import copy
import unittest
from types import SimpleNamespace
from unittest.mock import Mock, patch

from crm import app_icon
from crm.branding import BRANDING


class TestAppIcon(unittest.TestCase):
	def app(self, **values):
		return {
			"name": "Frappe CRM",
			"app": "crm",
			"icon_type": "App",
			"label": "Frappe CRM",
			"logo_url": "/old.svg",
			"hidden": 0,
			"link": "/crm",
			"idx": 9,
			"parent_icon": "Sales",
			"roles": ["Sales User"],
			**values,
		}

	def workspace(self, name, app):
		return {
			"name": name,
			"app": app,
			"icon_type": "Link",
			"link_type": "Workspace Sidebar",
			"link_to": name,
			"label": name,
		}

	def test_cached_icons_reconcile_without_mutating_source_or_other_apps(self):
		primary = self.app()
		sibling = {"name": "Framework", "app": "frappe", "icon_type": "App", "label": "ReyBill Work"}
		custom = {**self.workspace("CRM", "another_app"), "custom": "preserve"}
		icons = [
			primary,
			self.app(name="ReyBill CRM"),
			self.workspace("CRM", "erpnext"),
			self.workspace("Frappe CRM", "crm"),
			sibling,
			custom,
		]
		original = copy.deepcopy(icons)
		result = app_icon.normalize_desktop_icons(icons)
		self.assertEqual(icons, original)
		self.assertEqual(len(result), 3)
		self.assertIs(result[1], sibling)
		self.assertIs(result[2], custom)
		self.assertEqual(
			result[0], {**primary, "label": BRANDING["appName"], "logo_url": BRANDING["appIcon"]}
		)

	def test_removed_state_and_permission_filtered_absence_are_respected(self):
		workspace = self.workspace("CRM", "erpnext")
		icons = [workspace]
		self.assertIs(app_icon.normalize_desktop_icons(icons), icons)
		hidden = self.app(hidden=1)
		result = app_icon.normalize_desktop_icons([hidden, workspace])
		self.assertEqual(result[0]["hidden"], 1)
		self.assertIs(result[1], workspace)

	def test_visible_record_wins_over_hidden_duplicate_using_native_hidden_values(self):
		for hidden, visible in ((1, 0), ("1", "0")):
			with self.subTest(hidden=hidden):
				result = app_icon.normalize_desktop_icons(
					[
						self.app(hidden=hidden),
						self.app(name="Current CRM", hidden=visible),
					]
				)
				self.assertEqual([row["name"] for row in result], ["Current CRM"])

	def test_custom_workspace_and_unverified_ownership_are_preserved(self):
		rows = [
			self.workspace("CRM", None),
			self.workspace("CRM", "custom_app"),
			{**self.workspace("CRM", "erpnext"), "name": "My CRM"},
			{**self.workspace("CRM", "erpnext"), "link_type": "External"},
		]
		result = app_icon.normalize_desktop_icons([self.app(), *rows])
		self.assertEqual(result[1:], rows)
		for original, rendered in zip(rows, result[1:], strict=True):
			self.assertIs(original, rendered)

	def test_cached_boot_is_reconciled_idempotently(self):
		icons = [self.app(), self.workspace("CRM", "erpnext")]
		boot = {"from_cache": 1, "desktop_icons": icons, "other": "preserve"}
		app_icon.extend_bootinfo(boot)
		first = copy.deepcopy(boot)
		app_icon.extend_bootinfo(boot)
		self.assertEqual(boot, first)
		self.assertEqual(boot["crm_app_icon"]["src"], BRANDING["appIcon"])
		self.assertEqual(icons[0]["label"], "Frappe CRM")
		self.assertEqual(len(boot["desktop_icons"]), 1)

	def test_migration_updates_all_crm_app_records_without_export_or_layout_writes(self):
		docs = {name: Mock() for name in ("Frappe CRM", "ReyBill CRM")}
		for doc in docs.values():
			doc.get.return_value = "legacy"
		frappe = SimpleNamespace(
			db=Mock(),
			cache=Mock(),
			get_all=Mock(return_value=list(docs)),
			get_doc=Mock(side_effect=lambda dt, name: docs[name]),
		)
		with patch.object(app_icon, "frappe", frappe):
			app_icon.sync_desktop_icon()
		frappe.get_all.assert_called_once_with(
			"Desktop Icon", filters={"app": "crm", "icon_type": "App"}, pluck="name"
		)
		for doc in docs.values():
			doc.db_set.assert_called_once_with(
				{"label": BRANDING["appName"], "logo_url": BRANDING["appIcon"]}
			)
			doc.save.assert_not_called()
		frappe.db.set_value.assert_not_called()
		self.assertEqual(
			[call.args[0] for call in frappe.cache.delete_key.call_args_list], ["desktop_icons", "bootinfo"]
		)

	def test_framework_without_desktop_icon_is_supported(self):
		frappe = SimpleNamespace(db=Mock(), get_all=Mock())
		frappe.db.exists.return_value = False
		with patch.object(app_icon, "frappe", frappe):
			app_icon.sync_desktop_icon()
		frappe.get_all.assert_not_called()
