# Test results — 2026-11-05

Environment: Frappe 16.36.1 (`97a5dd93`), ERPNext 16.37.0, CRM fork version 1.91.1.

Tested implementation: `7e43e6b2dd6026ebf2502f108e3b53560e3977b9`. Browser tests used the real `reybill.localhost` database through a temporary loopback-only fork server on port 8012. The server imported `apps/reybill_crm/crm` and served that checkout's own assets; it did not switch or overwrite the installed checkout. German/Arabic MO files were overlaid only in that QA server; the installed app's shared compiled catalogs were not replaced.

| Check | Result | Evidence |
| --- | --- | --- |
| Frontend regression suite | 365 passed, 42 files | [log](validation/frontend-tests.txt) |
| Branding backend contracts | 4 passed | [log](validation/backend-branding.txt) |
| Existing ERP pricing/script tests | 7 passed | [log](validation/backend-pricing.txt) |
| Production frontend build | Passed; 155 precache entries | [log](validation/frontend-build.txt) |
| Changed-source ESLint | 0 errors; one existing unused Avatar warning in Tasks.vue | [log](validation/eslint.txt) |
| Locale compilation | All 33 catalogs compile; gettext placeholders preserved | [summary](test-summary.json) |
| Read-only browser smoke suite | 15 passed, zero JavaScript page errors | [JSON](validation/browser-results.json) |
| Native password authentication | Login, authenticated CRM HTTP 200, logout passed | [JSON](validation/password-login-results.json) |
| Public links | All 16 checked destinations returned HTTP 200, including the published source branch | [checks](external-link-checks.json) |
| Assets and legal | Supplied artwork and original AGPL license preserved byte-for-byte | [provenance](asset-provenance.json) |
| Integration structure | ERP Python ASTs and DocType structural identifiers preserved | Implementation audit |
| Existing work | All original active-checkout source hashes still match the verified backup | Preservation audit |

Browser coverage includes guest access denial and branded native login, authenticated loading, onboarding in its existing active/completed state, Leads/Deals/Contacts/Organizations navigation and unsaved create dialogs, the deal Kanban pipeline, app switching, settings and the disabled ERP integration UI, native theme switching, About in both themes, legal/source links, favicon, PWA manifest/icon/service-worker responses, visible German and Arabic ERP settings headings, and 390px mobile drawer/navigation/overflow checks. [Light About](validation/about-light.png) and [dark About](validation/about-dark.png) screenshots contain no customer records.

The password check created one uniquely named temporary Sales User with welcome email disabled and generated credentials stored outside Git. It used the actual native login form and logout API. That user was removed, audit sessions revoked, credential files deleted, and the temporary QA server stopped. Smoke checks did not save CRM forms. CRM aggregate counts remained 1 Lead, 0 Deals, 1,156 Contacts and 0 Organizations. ERP configuration remained disabled, same-site, with sync_products=1. A database backup was created before backend QA at `sites/reybill.localhost/private/backups/20261105_145556-reybill_localhost-database.sql.gz`.

## Limits and observed remaining items

- Live local/remote ERP synchronization and quotation creation were not executed because integration is disabled. Field/API contracts and pricing behavior passed; this does not establish an end-to-end live sync result.
- Outbound browser requests were blocked during QA. Existing Framework telemetry attempted `pulse.m.frappe.cloud`; its consent/configuration behavior was preserved. No real telephony, Facebook, mail-provider, payment or remote ERP action was performed.
- Existing CRM records were read and create dialogs opened; full create/save/convert/delete workflows were not exercised by the branding smoke suite. External invitation delivery was mocked in the backend contract test.
- Arabic strings and layout at the tested viewport rendered without JavaScript errors; a full RTL/linguistic accessibility review and broader real-device matrix remain release checks.
- The manifest identity/scope is corrected. Upstream service-worker registration still scopes the worker to `/assets/crm/frontend/`; this audit does not claim offline CRM navigation. OS-managed installed icons/splashes require device/cache validation or reinstallation.
- Build output reports the existing large-chunk and stale Browserslist warnings. No dependency upgrade was introduced to silence them.

Run `yarn test:run` and `yarn build` in frontend. Backend checks use `bench --site reybill.localhost run-tests --module crm.tests.test_branding --skip-before-tests` and the equivalent `crm.fcrm.doctype.crm_products.test_crm_products` command. For an isolated checkout, set PYTHONPATH to that checkout before invoking bench. The browser harness is `scripts/validate_branding.cjs`, using REYBILL_BASE_URL, REYBILL_SESSION_FILE and REYBILL_QA_OUTPUT. Provide a protected native test-session file; never commit credentials. Install Playwright and its browser/runtime libraries in the test environment before running it.
