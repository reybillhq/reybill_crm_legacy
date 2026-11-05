"""Metadata must be readable without importing Frappe or executing hooks.py."""

import ast
import json
import unittest
from pathlib import Path


class TestPressMetadata(unittest.TestCase):
	def test_static_metadata_matches_branding(self):
		package = Path(__file__).resolve().parents[1]
		branding = json.loads((package / "branding.json").read_text())
		assignments = {
			target.id: node.value
			for node in ast.parse((package / "hooks.py").read_text()).body
			if isinstance(node, ast.Assign)
			for target in node.targets
			if isinstance(target, ast.Name)
		}
		expected = {
			"app_name": "crm",
			"app_title": branding["appName"],
			"app_publisher": branding["companyName"],
			"app_description": branding["description"],
			"app_email": "",
			"app_license": "AGPLv3",
		}
		for key, value in expected.items():
			with self.subTest(key=key):
				self.assertIsInstance(assignments[key], ast.Constant)
				self.assertEqual(assignments[key].value, value)

	def test_native_package_layout(self):
		package = Path(__file__).resolve().parents[1]
		for filename in ("__init__.py", "hooks.py", "modules.txt", "patches.txt"):
			with self.subTest(filename=filename):
				self.assertTrue((package / filename).is_file())
		self.assertTrue((package.parent / "pyproject.toml").is_file())
