# ReyBill Sales implementation

The customer-facing CRM now uses ReyBill Sales identity, official ReyBill artwork and the active ReyBill Core accent palette. Work is isolated in `apps/reybill_crm`; the installed `apps/crm` checkout remains on its original branch with its original modifications.

## Repository and commits

- Fork: https://github.com/reybillhq/reybill_crm
- Feature branch: `feat/reybill-sales-branding`
- Stable baseline: `1cd8334c4d889df541588b5112f029070e013987` (app version 1.91.1).
- Inventory checkpoint: `aa504eb`.
- Original v16 compatibility patch: `2230d56`.
- Main branding implementation: `11406ac`.
- Final app-selector correction and expanded browser validation: `7e43e6b2dd6026ebf2502f108e3b53560e3977b9`.
- `origin` points to the ReyBill fork; `upstream` points to Frappe CRM. Neither stable main branch was merged or changed. No release or production deployment was performed.

## Changes and decisions

- `crm/branding.json` is the shared identity, asset, palette and verified link configuration, consumed by Python, Vue and Vite. Translatable complete messages remain literal so gettext can extract them.
- Hooks, launcher metadata and workspace display titles use ReyBill Sales. The internal application/package remains `crm`; the workspace record identifier remains `Frappe CRM`.
- A reusable logo component selects unchanged official light/dark artwork. Ten copied asset files match the four supplied originals byte-for-byte; see [provenance](asset-provenance.json). The primary and subtle action accents use exact values from the active ReyBill Core CSS. No independent palette or logo was invented.
- Shared login/authentication branding is supplied by the existing ReyBill Core installation on this bench and was verified through its native login page. No ReyBill Core code was changed; a standalone installation without it needs equivalent shared-site authentication branding.
- Existing FCRM Settings overrides still work. Blank settings and saved legacy `CRM` / `Frappe CRM` names inherit ReyBill Sales. The page-meta wrapper supplies branded titles and favicon defaults while preserving view icons and custom branding.
- Browser and Apple metadata, PWA identity and manifest app scope use ReyBill Sales. The favicon and PWA icon use the original 2133-square PNG with its actual size. Thirty-nine obsolete launch/tutorial assets were retired; [their original hashes](retired-assets.csv) and Git history preserve recovery.
- Cloud signup, trial, billing and dashboard controls are no longer reachable from customer menus. Inactive upstream adapter modules remain for mergeability. Backend authentication and site detection were preserved.
- Unavailable article links were removed from list empty states, help, settings, email setup and form-script metadata. The local help presentation keeps the existing native onboarding state and steps without rendering upstream articles. The old conversion recording was replaced with a text instruction and its existing action.
- About retains upstream attribution and copyright and offers the verified website and publicly accessible corresponding source branch. Original author metadata, Python copyright headers, the AGPL license and the compatibility component's MIT notice remain intact. Package license metadata now matches the AGPL license file.
- Product labels and messages use ReyBill ERP. Python imports, stored provider values, DocTypes, field names, integration methods and API paths remain unchanged. The actual external setting name `Frappe CRM Data Synchronization` remains in remote setup instructions.
- App switching distinguishes the ReyBill platform from ReyBill ERP, preserves Rental, and retains all native routes.
- All 33 PO catalogs compile. Forty branding-specific German and Arabic strings were checked; other existing translations and technical lookup identifiers were preserved. No speculative documentation URL or support mailbox was added.

## Compatibility evidence

The linked frozen Framework UI still needs FeatherIcon, removed from the pinned frappe-ui 1.0.0-rc.2 exports. The original scoped resolver/component, exact dependency, lockfile, license and regression tests were carried together. No framework upgrade or dependency downgrade was used. Four ERP/product Python files have identical parsed syntax trees after normalizing only the displayed product names. The two changed DocType JSON files have identical schemas after excluding display labels/help metadata.

[All changed files](CHANGES.md) · [Test results and limits](TEST_RESULTS.md) · [Release checks](NEXT_STEPS.md)
