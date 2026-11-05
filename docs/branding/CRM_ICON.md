# Official ReyBill CRM icon update

The supplied `crm/public/images/reybill-crm.svg` is now used for the CRM app launcher, sidebar/default component, browser favicon and PWA icon. Its artwork is unchanged (SHA-256 `9d004a8f2129c0b2ac24bab71dc63fc4e39850e2423d227eb9e5ce4a87d22862`). The Desk application is labeled **ReyBill CRM**.

## Scope and configuration

- Active site: `reybill.localhost`, tested through the existing Nginx endpoint on port 8000.
- Active checkout: `apps/crm`, original branch/commit retained, with only this icon patch applied alongside the pre-existing compatibility changes.
- The same change is carried on `apps/reybill_crm`, branch `feat/reybill-sales-branding`; its earlier ReyBill Sales product copy and About wordmarks remain intact.
- `crm/branding.json` centralizes `appName` and `appIcon`. Hooks use these for app title, icon URL, launcher title and logo. The internal app name remains `crm`, the route remains `/crm`, and `crm.api.check_app_permission` is unchanged.
- The new `crm.app_icon.sync_desktop_icon` migration hook changes only the native CRM App tile's label/logo. The existing Desktop Icon record name (`Frappe CRM`), route, position, removal state and permissions are retained. It is idempotent and avoids exporting or renaming records.
- A CRM-owned Desktop page extension updates stale icon presentation in runtime copies of saved-layout arrays. It never rewrites saved layouts or local storage and never changes another app's icon.
- CRM's existing saved brand logo incorrectly pointed at a Farm icon. Only the CRM `brand_logo` and `favicon` settings were updated to the supplied SVG. The Farm app and its asset are untouched. Tenant custom-branding support remains available.
- The legacy `/assets/crm/images/logo.svg` alias also serves the supplied SVG unchanged. Old launcher/PWA icon references were replaced; obsolete Apple splash references were removed rather than generating replacement artwork. No converted PNG or invented maskable artwork was added.
- The fork's ERP icon retains its previous parent-brand artwork; it does not inherit the CRM-specific glyph.

## Validation

| Check | Result |
| --- | --- |
| Active CRM production frontend build | Passed |
| ReyBill fork production frontend build | Passed |
| Active frontend suite | 361 passed |
| Fork frontend suite | 366 passed |
| Backend branding/integration contracts | 4 passed |
| Desktop cached-layout/other-app invariants | 4 Node tests passed |
| Changed frontend source lint | No errors or warnings |
| Native browser checks | 6 passed; zero JavaScript page errors |
| Live SVG response | HTTP 200, image/svg+xml, exact supplied bytes |
| Desk after ordinary browser refresh | ReyBill CRM, supplied SVG, `/crm` route |
| Cached saved-layout presentation | New CRM label/icon; storage and other app metadata unchanged |
| Dark mode | Supplied colors preserved, no image filter |
| Existing Desktop records/layouts | Non-CRM records and saved layouts unchanged |

[Native browser results](crm-icon-validation/results.json), [preservation checks](crm-icon-validation/preservation.json), and [Desk tile screenshot](crm-icon-validation/desk-tile.png). Build/frontend/backend logs are in the same validation directory. Reproduce the native UI checks with `scripts/verify_crm_icon.cjs` and a protected native test-session file; never commit session values.

The supplied SVG, original compatibility component/plugin/tests, package.json and yarn.lock were verified against the pre-change backup. The existing Vite compatibility configuration remains present; formatting outside the icon patch was retained and its parsed syntax tree matches the tested build. Recoverable source archives and the original targeted site settings are under `/home/frappe/frappe/frappe-bench-v16/backups/reybill-crm-icon-20261105T102430Z` (owner-only, outside Git).

The test site's cache was cleared and its web workers gracefully reloaded to load the hooks. The temporary verification session was revoked and its secret file removed. No other ReyBill application code, icon records or saved layouts were changed. No production release or branch merge was performed.
