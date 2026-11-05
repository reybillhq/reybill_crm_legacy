# ReyBill CRM About and app-switcher correction

**Activation completed:** the normal test site now serves the reconciled **ReyBill CRM 1.92.0** fork. See [activation summary](ACTIVATION.md). The earlier preview-stage findings below are retained as history.

Official product: **ReyBill CRM**. Branch: `feat/reybill-sales-branding` (existing branch name retained). This report supersedes the product naming and switcher behavior in the earlier historical audit; previous commits and evidence are preserved.

## Causes and runtime diagnosis

| Issue | Cause | Correction |
| --- | --- | --- |
| Browser still showed Desk, ERPNext and upstream About | The default local service imports `apps/crm/crm`, version **1.92.0**, and `/assets/crm` points to that checkout. Previous full branding was committed and built in `apps/reybill_crm`, version **1.91.1**. The icon patch alone was applied to the installed checkout. | Build and authenticate against the exact fork backend and assets on the same development site through loopback port **8012**. This mismatch is now resolved by merging the exact installed 1.92.0 release into the branded fork and activating it on the normal test endpoint; see ACTIVATION.md. |
| Incorrect fork product name | Shared JSON and several literal UI/server strings still used the former working name ReyBill Sales. | Correct central defaults, setup/access messages, package descriptions, Workspace display labels, integration messages and active translation catalogs. Normalize saved former defaults while preserving custom customer names. |
| ERPNext remained in fork switcher | Previous implementation renamed its entry to ReyBill ERP instead of excluding it. | Filter the registry by `app.name`, excluding `erpnext` and the current `crm` entry. Insert one ReyBill platform entry at `/desk`; do not change the global registry. |
| Stale switcher metadata | The old `apps` resource cache could restore an earlier permission-filtered registry snapshot from IndexedDB. | Fetch registry data for each new dropdown instance without restoring that cache. Native permission checks remain authoritative. |
| Fork About incomplete | It used parent wordmarks, lacked company/version metadata and had only website/source actions. | Use the official CRM SVG, ReyBill Technologies Ltd., server-provided installed version, verified actions and a separate Open Source Licenses section. |
| Command-palette settings inconsistency | An ERPNext display/selection entry remained after the settings page was renamed ReyBill ERP. | Use the existing shared `erpName` value so the displayed command opens the correct settings page. |

This was primarily **missing source behavior, incorrect configuration, and the wrong running checkout/build**. There was no evidence that a PWA cache caused the original About rendering. The built worker uses `skipWaiting`, `clientsClaim`, obsolete-cache cleanup and revisioned assets. Its observed scope is `/assets/crm/frontend/`; it does not control `/crm` navigation. Ordinary reload with a real legacy `apps` IndexedDB value present displays current branding. No CSS text hiding, browser-wide cache deletion or saved layout rewrite is used.

## Core architecture consulted

Read-only inspection covered `reybill_core/branding.py`, `about.py`, `boot.py`, `public/js/about.js`, native navigation adapters, tests and `docs/CRM_INTEGRATION_AUDIT.md` CORE-009/010/011. Those milestones explicitly assign standalone CRM branding to CRM and preserve technical identities and native permissions. Core's canonical platform name is **ReyBill**, current support URL is **https://reybill.com**, and its company name is ReyBill Technologies Ltd. CRM retains its existing `branding.json` architecture and uses the user's specified company punctuation.

No protected app source was edited. [Byte and Git-state checks](about-switcher-validation/source-preservation.json) cover `crm`, `frappe`, `erpnext`, `reybill_core`, `reybill_farm`, and `reybill_equipment_rental`, including their pre-existing uncommitted changes.

## Final customer behavior

The CRM menu shows **ReyBill** opening `/desk`, plus every other app returned by native permission checks except `crm`, `erpnext` and a duplicate native `frappe` entry. Administrator retains **Rental → `/rental`**. The two tested Sales User/Manager sessions have no permission-granted sibling entries and correctly show only ReyBill. Unknown/newly registered apps retain all metadata and routes; there is no fixed installed-app allowlist. App identifiers, authorization callbacks, DocTypes, API endpoints and global app registry are unchanged.

About shows:

- **ReyBill CRM**, official unchanged `reybill-crm.svg`, and **ReyBill Technologies Ltd.**
- Actual installed backend version from `crm.__version__`, injected by CRM boot. Verified fork value: **1.91.1**; no fallback version is fabricated.
- Website: https://reybill.com
- GitHub Repository: https://github.com/reybillhq/reybill_crm
- Source Code: https://github.com/reybillhq/reybill_crm/tree/feat/reybill-sales-branding
- Report an Issue: https://github.com/reybillhq/reybill_crm/issues
- Contact Support: https://reybill.com, matching Core's current canonical configuration.
- Open Source Licenses: original Frappe CRM attribution, copyright Frappe Technologies Pvt. Ltd. and contributors, and AGPLv3. Original LICENSE, author metadata and source notices remain intact. The primary company attribution does not claim ownership of upstream code.

Website, repository, source branch and issue tracker returned HTTP 200. `https://docs.reybill.com` returned **404**, so no Documentation action is rendered. The proposed console support URL redirects to an HTTP 200 login page preserving the support destination; the protected support page could not be verified, so CRM retains Core's current support fallback. No speculative action is enabled. [HTTP evidence](about-switcher-validation/external-links.json).

[Light About](about-switcher-validation/about-light.png), [dark About](about-switcher-validation/about-dark.png), and [app switcher](about-switcher-validation/app-switcher.png).

## Verification and limits

| Verification | Result |
| --- | --- |
| Full frontend suite | 370 tests, 44 files passed |
| Branding/native identity/invitation/ERP contracts | 4 passed |
| CRM product/pricing and ERP-compatible script contracts | 7 passed |
| Existing Desktop icon/layout preservation tests | 4 passed |
| Final production build | Passed |
| Changed frontend ESLint | Passed |
| 33 translation catalogs | Parsed and compiled; zero new placeholder errors; four catalogs retain one pre-existing warning each |
| Authenticated CRM suite | 16 checks passed: Leads/Deals/Contacts/Organizations, create dialogs without saves, pipeline, switcher, About both themes, settings, command palette, PWA, German/Arabic and mobile |
| Supplementary native navigation/cache/roles | 6 checks passed; zero JavaScript errors |
| Runtime identity | Fork Python source/version verified; served HTML, manifest and worker hashes match the fork build |
| Source preservation | All protected repositories and their uncommitted work unchanged |
| Business data | Counts unchanged: 1 lead, 0 deals, 1,156 contacts, 0 organizations |
| QA cleanup | Temporary users and sessions removed; no credentials committed |

See [CRM browser results](about-switcher-validation/browser-results.json), [switcher/navigation results](about-switcher-validation/switcher-results.json), [build identity](about-switcher-validation/build-identity.json), and [site state](about-switcher-validation/site-state.json). Logs are in the same directory. Browser harnesses are `scripts/validate_branding.cjs` and `scripts/verify_app_branding.cjs`; provide protected session files through their environment variables. Screenshots retained in Git are cropped to About and app menu and contain no customer records.

ERP integration is **disabled on this site** and remains disabled. Its remote API path, integration fieldnames, custom-field contracts and product/pricing logic passed tests. No remote write, live sync, ERP activation or business record creation was performed, so a live end-to-end ERP sync is not claimed. Existing Framework telemetry attempted `pulse.m.frappe.cloud` during the CRM suite and was blocked by the QA browser; this task does not change consent or backend provider behavior.

Initial role probes encountered the native password-setup redirect for two existing demo accounts. Only the reset metadata generated by those probes was restored from the pre-task private snapshot, guarded by the observed QA generation timestamps. No passwords changed and no email was sent. The successful role checks used separate temporary password-enabled users; those users and all task sessions were removed.

## Remaining references

[Every remaining matching source line and its reason](about-switcher-validation/remaining-references.csv) is classified; [counts by reason](about-switcher-validation/remaining-reference-summary.json) are included. Retained references are original legal/author notices; native app/Workspace identities; ERPNext DocTypes, fields and API contracts; exact remote setting/provider names; translation context and inactive legacy entries; regression fixtures; and legacy-default detection. The former product name remains deliberately in saved-default detection and negative tests, and in historical audit evidence. The unchanged Git branch/source URL is a technical identifier. Unreferenced vendor-hosting adapters remain source compatibility code with no customer entry point. No active customer-facing ReyBill Sales label remains in the verified fork UI.

GitHub's repository description still uses the former product name; this is external repository metadata, outside the application checkout. Its application README and package description are corrected here.

## Files and delivery

[Exact changed paths](ABOUT_SWITCHER_FILES.md) include the central branding config, CRM boot, About, dropdown/pure switcher function, command-palette entry, saved-settings fallbacks, setup/access/ERP display strings, Workspace display metadata, 33 PO catalogs/POT, package descriptions, README, focused tests, browser harnesses and this evidence. Internal record identities and routes are preserved.

The pre-task source hashes, statuses and original fork HEAD are private under `backups/reybill-crm-about-20261105T131137Z`. The prior icon and full rebranding archives remain intact. Work stays on the existing feature branch; no stable merge, release or production deployment is performed.

At the time of this historical report, activation was pending because the fork was 1.91.1 and the installed checkout was 1.92.0. That blocker is resolved: the fork incorporates the exact 1.92.0 release and is active on the normal test URL. The old preview server has been stopped. See [activation evidence and rollback](ACTIVATION.md).
