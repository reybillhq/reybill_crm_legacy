# ReyBill CRM on ReyBill Press

Repository: https://github.com/reybillhq/reybill_crm  
Select branch: **`release/v0.0.2`**  
Distribution release tag: **`v0.0.2`**  
Internal application / Python package: **`crm`**  
Application title: **ReyBill CRM**  
Publisher: **ReyBill Technologies Ltd.**

The backend version remains **1.92.0**, dynamically read from
`crm/__init__.py`. The distribution tags `v0.0.1` and `v0.0.2` use a separate
release sequence; they do not reset the backend's version or migration history.
The published `v0.0.1` tag is preserved.

## Why the original import failed

Press discovers the app from the `crm` directory containing both `hooks.py`
and `patches.txt`. It reads `hooks.py` as text, without importing the Python
module or evaluating `BRANDING`. Its
[`_get_app_name_and_title_from_hooks` validator](https://github.com/frappe/press/blob/4088700ce2bd6bdc39a7f8c39206f86d8ae9226b/press/api/github.py#L545)
requires a quoted literal assignment for `app_title`. The original
`app_title = BRANDING["appName"]` therefore produced the reported missing-title
error even though the application displayed the correct title at runtime.

The metadata is now static:

```python
app_name = "crm"
app_title = "ReyBill CRM"
app_publisher = "ReyBill Technologies Ltd."
app_description = "ReyBill CRM helps teams manage leads, deals and customer relationships."
app_email = ""
app_license = "AGPLv3"
```

There is no verified support email configured; none is invented. Press's
repository validator does not require a nonempty email. The supported Frappe
range remains `>=15.0.0,<17.0.0` in root `pyproject.toml`, with the existing Flit
build backend, dependencies and `crm` distribution name. Runtime branding,
icons, routes, permissions, API paths, DocTypes and original license notices
are unchanged. Tests guard the literal metadata against central branding drift.

At the time of this correction, the repository's default `main` branch still
contained older upstream branding. Explicitly select `release/v0.0.2` rather
than accepting the default. Press fetches a GitHub **branch** when importing an
App Source; use the release branch in the branch field, not the tag name.

## Add through App Manager

1. Open the intended **test** bench group. This fork has been tested with
   Frappe v16. Its frontend requires the sibling Frappe `ui/src` tree and the
   Node version required by the locked frontend toolchain (Node 22.12+ or
   24 LTS). The declared v15 range is retained; this change does not establish
   end-to-end v15 compatibility.
2. Add the repository URL above and select **`release/v0.0.2`**. Expected detected
   name: `crm`; expected title: `ReyBill CRM`. Refresh/retry a previously failed
   import after selecting the corrected branch. If your App Manager cannot
   change the selected branch, have its administrator add this exact App Source.
3. Check whether the group already has an app whose internal name is **`crm`**.
   If it does, follow the replacement procedure below. If it does not, add this
   source once and build/deploy the test group using its normal Press workflow.
4. For a site that does not already have CRM installed, install the detected
   `crm` app through the site's Apps screen. Existing CRM sites keep their
   installed application and records.
5. Confirm the built source hash matches the published `v0.0.2` tag. After the
   normal build, migration and test deployment, open `/crm` and `/desk` and check
   the title, official artwork and the dynamic backend version **1.92.0**.

## Replace an existing CRM source

Upstream CRM and ReyBill CRM have the same internal identity, `crm`. Native
Press [`validate_duplicate_app`](https://github.com/frappe/press/blob/4088700ce2bd6bdc39a7f8c39206f86d8ae9226b/press/press/doctype/release_group/release_group.py#L682)
rejects two `crm` entries with **“App crm can be added only once”**.

Back up the test site's database and files and record its current App Source and
deployed revision. In the test bench group, change the **source of the existing
`crm` app entry** to the ReyBill repository and `release/v0.0.2`. Keep exactly
one `crm` row, with the same internal app identity. Use the App Manager's source
or branch-change control; if unavailable, ask its administrator to change the
App Source reference on that row using the supported Press interface.

Build and review the test deployment before deploying it. Do **not** uninstall
CRM, remove its database objects, install a second `reybill_crm` package, or
rename any DocTypes. Retain the previous source/revision for rollback through
the usual Press deployment process. Test migrations on the backup before any
later production rollout, particularly when replacing a different CRM version.

Local inspection confirmed one installed app named `crm`; the active editable
package and assets point to this fork. An additional preserved checkout folder
does not represent a second installed app. No live ReyBill Press instance or
bench-group credentials were available during this correction, so its current
App Source rows and UI controls could not be inspected. The duplicate-app rule
was tested using the actual upstream validator; the live group's administrator
must confirm its selected source before deployment.

## Reproduce compatibility checks

From this checkout, using the bench Python environment:

```sh
python -m unittest crm.tests.test_press_metadata
python scripts/verify_press_compatibility.py --live --branch release/v0.0.2
yarn --cwd frontend test:run
```

The harness downloads SHA-256-checked Press source pinned to
`4088700ce2bd6bdc39a7f8c39206f86d8ae9226b` and executes its original repository
validator functions. It supplies GitHub-shaped local repository responses for
the old tag and working tree, then uses the real public GitHub API with `--live`.
Only service decorators and authentication setup are omitted; parser and
validation bodies are unchanged. No Press database or deployment is modified.

Checks reproduce the exact `v0.0.1` failure, accept the corrected `crm` title and
Frappe range, reject duplicate `crm` entries and accept one replacement entry.
The metadata/layout tests and existing branding, invitation and ERP contract
tests also pass. The full frontend suite passes (380 tests, 47 files).
This tests actual upstream Press code, not an authenticated import through the
unavailable ReyBill Press service; a customized validator there may differ.
