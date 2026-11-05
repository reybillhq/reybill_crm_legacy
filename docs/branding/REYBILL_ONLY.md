# ReyBill customer-facing branding

ReyBill, ReyBill CRM, ReyBill ERP and ReyBill Technologies Ltd. are the display
identities. Internal app names, DocTypes, API methods, fields, permissions and
provider identifiers remain unchanged. This report supersedes the main Legal
Notices presentation described in ABOUT_REDESIGN.md; earlier evidence remains
historical.

## Presentation corrections

- Legal Notices uses ReyBill identity, AGPLv3 rights and warranty information,
  and three actions: View License, Access Corresponding Source and Third-Party
  Notices. No upstream product-history explanation appears on the main page.
- View License includes project copyright/author notices followed by the full
  unchanged AGPLv3 text. Third-Party Notices also preserves project attribution
  and original bundled library notices. Corresponding source downloads the
  exact public build commit at no charge. The original AGPL-only URL still works.
- Workflow action groups map native `frappe`, `crm` and `erpnext` app IDs to the
  central platform/CRM/ERP display names. Action identities, metadata, registered
  permissions and unknown app groups are preserved.
- New/edit email-template examples use the central company name, preserving
  Jinja tokens and customer template data. The accented former vendor signature
  is removed too. Old German/Dutch translations are no longer referenced.
- Legacy hosting confirmation copy is neutral; its technical adapter/export,
  provider endpoint and compatibility behavior remain intact. No hosting control
  is newly enabled. Command-palette display/search copy uses ReyBill ERP.

## Legal review and required remaining names

The original AGPLv3 sections 0, 4, 5(d), 7(b) and 13 and the
[FSF's explanation of interactive legal notices](https://www.fsf.org/blogs/community/gpl-compliant-legal-notices-author-attributions)
were reviewed. A visible menu item may provide appropriate notices; historical
marketing/product descriptions are not required by these clauses. No additional
project term requiring that history on the main page was found in the inspected
license, author metadata and source notices.

The main page's generic contributor statement does not replace original rights
holder attribution. Exact original names remain in the prominently linked
View License/Third-Party Notices materials, source headers, package author
metadata and repository license files. These materials identify original CRM
copyright separately from ReyBill modifications and do not claim upstream
ownership. Removing or replacing the original owners' names in those materials
would conflict with notice-preservation obligations; they are deliberately
retained, visibly available on opening the legal materials. Required library
copyright and license text is not rewritten to ReyBill.

## Audit and verification scope

Source inspection covers frontend templates/scripts, server display defaults,
metadata, documentation links, onboarding, notifications and translations.
Active gettext keys are compared against all 33 PO catalogs, with accent variants
included; no active translated upstream display name remains. Original translator
metadata, inactive message IDs, native DocType context and regression fixtures
are not customer branding and retain their technical/history content.

`audit_customer_branding.cjs` scans rendered text plus visible placeholders,
accessible labels and titles, including new email examples. It covers normal
navigation, create dialogs without saving, pipeline, notifications, onboarding,
switcher, all available Settings pages, email/workflow drafts, command palette
and German/Arabic/Dutch navigation/legal states. The About harness verifies
light/dark/mobile, focus, dismissal, ordinary refresh, exact source identity and
original attribution/license content in linked materials.

ERP validation is read-only: saved enabled settings, same-site quotation
permissions and sync-status endpoints are checked. Native identity, invitation,
remote ERP API path and integration-field contracts are tested with mocks.
No live sync, remote write, business-record save or integration reconfiguration
is performed. External provider dashboards, customer-authored content and every
possible state of an unconfigured integration are outside the rendered coverage;
no global text masking or response rewriting is used.

Detailed source classifications, screenshots and runtime evidence stay outside
Git. Production and other applications are not changed.

## Observed pre-existing site issues

The broad audit found zero upstream branding in 49 rendered states and all
36 screen checks passed. Its health result remains separate from branding:
four native read errors were observed on two Settings pages. They were reproduced
with the untouched pre-task frontend assets in an isolated browser using the
same test backend, without switching the actual running site.

- Email Templates requests `Email Template.enabled`; the site rejects it with
  `Field not permitted in query: enabled` (HTTP 417).
- Telephony requests the Administrator's missing `CRM Telephony Agent` record;
  assignment, permission and document reads return HTTP 404.

These errors are not caused by the display changes. No database field, agent
record or integration setting is added or altered to hide them. The audit
retains the errors explicitly and does not report full site health as passing.
The enabled ReyBill ERP settings, quotation permission and sync-status reads
passed, as did the native API/field compatibility contracts.
