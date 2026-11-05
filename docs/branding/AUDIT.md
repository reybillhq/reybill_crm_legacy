# ReyBill Sales branding audit

Inventory captured before implementation on 2026-11-05 from fork baseline `1cd8334c4d889df541588b5112f029070e013987`.

## Preservation and repository

- Active checkout: `apps/crm`, main `638bf3d`, upstream Frappe; five modified/untracked locations preserved, including the complete compatibility directory.
- Fork checkout: `apps/reybill_crm`, clean baseline above; branch `feat/reybill-sales-branding`.
- Verified backup: `backups/reybill-branding-20261105T091511Z`. Each checkout has a verified full Git bundle, source archive, SHA-256 manifest, status, HEAD, remotes and binary working/index diffs. All 1,143 active and 1,137 fork source files were compared against the archive.
- Fork `origin` is https://github.com/reybillhq/reybill_crm.git; `upstream` remains https://github.com/frappe/crm.git. The installed checkout is not overwritten or switched.

## Inventory and intended handling

`inventory-before.csv` records every matching tracked text line, including technical identifiers, translated strings and attribution. `external-links-before.csv` records all non-XML external URLs. Classification is contextual: category 5 explicitly requires separating display strings from integration keys.

| Location | Category | Intended action |
| --- | --- | --- |
| hooks.py, __init__.py, launcher/workspace metadata | 1 | ReyBill Sales titles; preserve app name, workspace record name and routes |
| frontend index, Vite PWA, manifest images and Apple splash images | 1 | Product name and official unchanged ReyBill assets; remove original launch screens |
| CRMLogo, BrandLogo, UserDropdown, AboutModal, preferences | 1, 4 | Official light/dark assets, existing custom branding overrides, preserve copyright and source access |
| Setup, NotPermitted, www/crm.py, invitations and invitation email | 1 | Product identity and translated messages |
| AppSidebar HelpModal, list empty states, settings help anchors | 2 | Hide unavailable documentation; no speculative docs.reybill.com article paths |
| Shared SignupBanner, TrialBanner, TrialCard and billing dropdown/settings | 2, 5 | Remove customer-facing Cloud marketing/billing entry points; retain authentication and backend framework APIs |
| ERPNext settings, products, quotations and sync errors | 1, 3, 5 | ReyBill ERP display text; keep imports, DocType names, fields, API routes and stored integration values |
| Frappe Mail provider | 5 | Keep actual provider identity and configuration keys; remove promotional link; preserve working integration |
| locale PO/POT catalogs, legacy translations | 1, 3 | Update product display keys and translations; preserve internal lookup identifiers where used as such |
| README, package and Python project metadata, GitHub templates | 1, 2, 4 | Fork identity and source repository; preserve authors, copyright and license |
| Framework APIs, frappe-ui, @framework/ui, telemetry/onboarding keys | 3 | Preserve unchanged |
| LICENSE, copyright headers, third-party icon shim MIT license, map attributions | 4 | Preserve unchanged |
| Facebook, email providers, maps, exchange-rate services | 5 | Retain functional provider links and required attribution |
| Historical developer design docs, screenshots and tests | 3, 4 | Preserve historical context; do not expose old screenshots as product marketing |

## Compatibility assessment

The active checkout adds a narrowly scoped Vite resolver for bare frappe-ui imports from the linked Frappe Framework UI source. That source still imports FeatherIcon, absent from the pinned frappe-ui 1.0.0-rc.2. Carry the original shim, MIT notice, exact feather-icons dependency/lockfile and boundary/rendering regression tests together. Do not upgrade Framework or change unrelated CRM behavior.

## Asset and destination decisions

Official sources are in reybill_core/public/images/branding. Preserve supplied artwork byte-for-byte, original aspect ratios and theme variants; copy into CRM-owned assets so the fork can run independently. The active ReyBill Core theme defines the light/dark primary accents (#74003a / #a82e68) and hover/active variants. Reuse those exact values for primary actions and PWA metadata; keep native semantic success/danger tokens. No newly invented logo, converted icon, or fabricated maskable artwork. Dedicated size-specific maskable icons and Apple splash screens are not supplied; remove legacy references and use the unchanged official square PNG as an `any` icon with its actual dimensions. Existing installs may need PWA reinstallation to refresh OS-managed icons.

reybill.com was verified to respond on 2026-11-05. The docs portal is planned; optional docs links must remain hidden. GitHub web fetch was inconclusive; verify fork access through Git before retaining a source download link. No production deployment, merge or release is authorized by this implementation.

## Completed implementation and remaining references

The inventory actions have been implemented and verified. Read [the implementation](IMPLEMENTATION.md), [complete file list](CHANGES.md), [test results](TEST_RESULTS.md) and [release checks](NEXT_STEPS.md). `inventory-after.csv` records every remaining matching tracked text line with a retention reason. Remaining references belong to preserved framework/dependency identifiers, actual integration/provider names, legal attribution, historical development material or inactive upstream adapters. Original historical GitHub screenshots remain in source but are no longer rendered by the README or application.

The customer UI retains Frappe attribution in About, the actual Frappe Mail provider identity, and the real remote ERP setting name where technically necessary. No upstream documentation, Cloud promotion or support link was found in the visible tested UI. Retained third-party provider help and map attribution links were verified; they serve integrations or required attribution.

An additional untracked `crm/public/images/reybill-crm.svg` appeared in the active checkout during the session. It was left untouched and added to the supplemental verified development-context archive, alongside the ignored AGENTS/CLAUDE/.pi instructions. Every original source file still matches the initial backup. The fork remains isolated from that active checkout.

The initial backup is owner-only and contains per-checkout Git bundles, working/index patches, SHA-256-verified source archives, and supplemental development context. Recover into a new directory from the bundle and overlay the matching source archive; do not overwrite the installed checkout. Private site configuration/database backups and QA credentials are not part of the Git deliverables.
