# v0.0.3 Desktop correction candidate

Status: prepared on `release/v0.0.3`. The actual ReyBill Press test-site URL,
bench-group name and access were not available in the workspace. A release tag
must not be presented as a verified Press deployment until the checks below have
run on that target. Published `v0.0.2` and its branch are preserved.

## Confirmed source findings

The v0.0.2 Press import fix exposed literal metadata. It did not establish the
running deployed checkout or reconcile every Desktop presentation source:

- Native Desktop loads stored `Desktop Icon` records, not just `app_title`.
  Its app-generation function skips an app when an icon already exists.
- `crm.app_icon.sync_desktop_icon` selected only the first CRM App record and
  invalidated `desktop_icons`, leaving cached `bootinfo` separately stored.
- CRM used `boot_session`, which runs only when boot data is created. Native
  `extend_bootinfo` also runs when an existing session boot cache is reused.
- The browser can restore a saved `Desktop Layout` instead of the boot array.
  The old CRM adapter refreshed artwork/title but did not remove duplicates.
- `app_logo_url` was absent, although `app_icon_url` and `add_to_apps_screen`
  already pointed to `/assets/crm/images/reybill-crm.svg`.

These are confirmed code gaps, not proof of which condition caused the reported
Press screen. The local `reybill.localhost` site at `94c2457` already had a
correctly branded stored CRM App record. An incorrect deployed checkout, an old
worker, stored icons, boot metadata and a saved layout must be distinguished
using evidence from the actual target.

## Correction

CRM now supplies both logo/icon hooks, refreshes all CRM App icon records and
invalidates both Desktop and boot caches on migration. Its `extend_bootinfo`
hook reconciles fresh and cached boot data. The Desktop page extension applies
the same presentation policy after native saved-layout restoration.

One existing CRM App entry is retained, preferring an entry that is visible in
the current layout. Its name, route, placement, folder, roles and removal state
are preserved. Only its display title and artwork are refreshed. Duplicate CRM
App entries are omitted from the presentation copy. A legacy workspace launcher
is omitted only when a visible CRM App exists and all these identities match:

| Stored app | Record name | Icon type | Link type | Target |
| --- | --- | --- | --- | --- |
| `crm` | `Frappe CRM` | `Link` | `Workspace Sidebar` | `Frappe CRM` |
| `erpnext` | `CRM` | `Link` | `Workspace Sidebar` | `CRM` |

The ERP row matches ReyBill Core's existing redundant-launcher policy. Unknown
ownership, custom workspaces and other applications are preserved. No record,
Workspace, module, role, business data, saved-layout JSON or local storage is
deleted or rewritten. Permission-filtered absence of the App is respected; the
adapter never grants access or fabricates a missing App launcher.

## Inspect the actual Press test deployment first

Use the deployed bench's Python interpreter. This script imports the **installed
`crm` package**, independently of the directory from which the script is read.
It opens a read-only SQL transaction and writes a private mode-0600 report:

```sh
env/bin/python /path/to/inspect_desktop_runtime.py \
  --site ACTUAL_TEST_SITE --sites-path /path/to/bench/sites \
  --user Administrator --output /tmp/crm-desktop-before.json
```

The script is `scripts/inspect_desktop_runtime.py` in this candidate and may be
copied to `/tmp` for pre-deployment inspection. It reports the imported Python
path, actual Git origin/commit/branch, backend version, source fingerprints,
branding hooks, effective Desktop page/boot hooks, relevant stored Workspace
and Desktop records, the selected user's cached metadata, saved-layout hash and
built frontend source commit. No persistent diagnostics API is added. Reports
can contain user layout metadata and should remain private.

Compare this with an authenticated request to the existing System Manager-only
`/api/method/crm.api.branding.get_runtime_info`. Check source, hook metadata and
served assets together; a Press Latest Version label or successful push alone
does not demonstrate that its workers and site are running that revision.

## Test deployment and browser verification

1. Identify the designated **test** bench/site and save the before report.
   Record its current source/revision and take the normal test-site backup.
2. Keep exactly one `crm` entry in the group. Select this repository and
   `release/v0.0.3` for the test source. Build and review the candidate, then
   deploy through the supported Press workflow with migrations and worker
   restart. Do not change a production group or uninstall CRM.
3. Confirm the actual source commit and served build match the candidate.
   Migration runs `crm.app_icon.sync_desktop_icon`. If a targeted retry is
   needed, use `bench --site ACTUAL_TEST_SITE execute
   crm.app_icon.sync_desktop_icon`, followed by
   `bench --site ACTUAL_TEST_SITE clear-cache`. A stale running interpreter
   requires the normal test deployment restart, not cache clearing alone.
4. Run the diagnostic again and compare the specific CRM rows, source hashes,
   caches and saved-layout hash. Keep original record names intact. Investigate
   a legacy row with missing/unknown ownership rather than hiding it by label.
5. Run the authenticated browser harness with an existing authorized test
   session file; never put the session in Git or a command argument:

```sh
REYBILL_ICON_BASE_URL=https://ACTUAL_TEST_SITE \
REYBILL_ICON_EXPECTED_COMMIT=FULL_CANDIDATE_COMMIT \
REYBILL_ICON_SESSION_FILE=/private/test-session \
REYBILL_ICON_QA_OUTPUT=/private/crm-desktop-results \
node scripts/verify_crm_icon.cjs
```

It checks actual backend and served build identity, byte-identical official SVG,
one visible branded CRM App, absence of the exact redundant ERP CRM launcher,
native app metadata, browser refresh, stale saved-layout duplicates without
persistence changes, and clicking the actual Desktop tile to open branded CRM.
Screenshots include `desk.png`, `desk-tile.png`, `crm-opened-from-desk.png` and
the official artwork in CRM light/dark themes. It requires an exact expected
commit for a remote site. Local results explicitly identify their local scope.

Only after these checks pass on the actual Press target should `v0.0.3` be
tagged and described as the verified correction. Do not move or replace the
existing `v0.0.2` tag.
