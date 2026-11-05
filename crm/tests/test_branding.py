"""Branding must leave native invitation and ERP API contracts intact."""
import unittest
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import Mock, patch

import frappe

from crm.branding import BRANDING, PRODUCT_NAME


class TestBranding(unittest.TestCase):
	def test_native_app_identity_and_official_assets(self):
		from crm import hooks

		self.assertEqual(hooks.app_name, "crm")
		self.assertEqual(hooks.app_title, BRANDING["appName"])
		self.assertEqual(hooks.add_to_apps_screen[0]["route"], "/crm")
		public = Path(__file__).parents[1] / "public"
		for key in ("logoLight", "logoDark", "iconLight", "iconDark"):
			self.assertTrue((public / BRANDING[key].removeprefix("/assets/crm/")).is_file())

	def test_invitation_uses_brand_without_changing_acceptance_link(self):
		from crm.fcrm.doctype.crm_invitation.crm_invitation import CRMInvitation

		invitation = SimpleNamespace(key="test-key", email="test@example.com", db_set=Mock())
		with patch.object(frappe, "sendmail") as sendmail, patch.object(
			frappe.utils, "get_url", side_effect=lambda path: "https://crm.example.com" + path
		):
			CRMInvitation.invite_via_email(invitation)
		kwargs = sendmail.call_args.kwargs
		self.assertIn(PRODUCT_NAME, kwargs["subject"])
		self.assertEqual(kwargs["template"], "crm_invitation")
		self.assertEqual(kwargs["args"]["title"], PRODUCT_NAME)
		self.assertTrue(kwargs["args"]["invite_link"].endswith(
			"/api/method/crm.api.accept_invitation?key=test-key"
		))

	def test_remote_erp_api_path_is_preserved(self):
		from crm.fcrm.doctype.erpnext_crm_settings import erpnext_crm_settings as erp

		client = Mock()
		with patch.object(erp, "get_erpnext_site_client", return_value=client):
			erp.ERPNextCRMSettings.create_custom_fields_in_remote_site(SimpleNamespace())
		client.post_api.assert_called_once_with(
			"erpnext.crm.frappe_crm_api.create_custom_fields_for_frappe_crm"
		)

	def test_erp_field_names_survive_display_label_changes(self):
		from crm.fcrm.doctype.erpnext_crm_settings import erpnext_crm_settings as erp

		settings = SimpleNamespace(is_erpnext_in_different_site=False)
		with patch.object(erp, "_is_erpnext_installed", return_value=True), patch.object(
			frappe.db, "exists", return_value=True
		), patch.object(erp, "_create_custom_fields") as create:
			erp.ERPNextCRMSettings.create_custom_fields_in_frappe_crm(settings)
		fields = create.call_args.args[0]
		self.assertEqual(fields["CRM Deal"][0]["fieldname"], "erpnext_customer")
		self.assertEqual(fields["CRM Product"][0]["fieldname"], "erpnext_item_code")
		self.assertEqual(fields["Quotation"][0]["fieldname"], "crm_deal")
		self.assertEqual(fields["Quotation"][0]["label"], "ReyBill Sales Deal")
