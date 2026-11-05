# Frozen Framework UI / CRM v1.92.0 compatibility

This adapter supports the locked Frappe 16.36.1 source at
`97a5dd93ca5883bcc9c4ef9834120c5cba397b67` with CRM 1.92.0 at
`638bf3db23e7142870819a213368e028866b79b1` and its exact
`frappe-ui 1.0.0-rc.2` dependency. It does not upgrade/downgrade installed apps,
alter authentication, or modify Framework source.

CRM already uses the v1 UI APIs. Its linked `@framework/ui` source on this older
Framework still imports `FeatherIcon`, removed from frappe-ui's root export.
Downgrading frappe-ui would break CRM's migrated APIs. The Vite plugin redirects
only bare `frappe-ui` imports originating inside that linked Framework source to
a local facade. All current exports pass through unchanged; the facade restores
only the missing FeatherIcon component. CRM and frappe-ui imports, subpaths and
unrelated modules retain native resolution.

## Provenance

`FeatherIcon.vue` is copied byte-for-byte from the last official source before
its removal:

https://github.com/frappe/frappe-ui/blob/ac74f68c2d8513ac6b3195bbbf4d4e78a50ce490/src/components/FeatherIcon.vue

Its MIT license is preserved in `LICENSE.frappe-ui`. Its original icon provider,
`feather-icons`, is declared directly at exact version 4.29.2 and locked with
registry integrity. Geometry, sizing, stroke, reactive names, attributes and
callbacks remain the official legacy behavior. The facade is private to CRM's
build; no dependency files are patched in node_modules.

## Maintenance in the ReyBill CRM fork

Carry this directory, Vite registration, the exact dependency/lockfile and the
associated regression tests as one isolated compatibility patch on the future
fork. Install with `yarn install --frozen-lockfile` and validate with
`yarn test:run` followed by `bench build --app crm`.

Re-evaluate after any approved change to the Framework UI source or CRM/UI pin.
Once the linked Framework components no longer import FeatherIcon, remove the
plugin, facade, original component/license, exact feather-icons dependency and
their tests together. Do not upgrade the locked Framework to remove this shim.

Official migration tracking:

- https://github.com/frappe/crm/issues/2636
- https://ui.frappe.io/docs/migration
- https://github.com/frappe/frappe-ui/commit/a0f7747dee84731500c868cc3763c31d7c0cdedf

## ReyBill fork validation

This patch was carried without resolver/component behavior changes to the ReyBill
fork baseline `1cd8334c4d889df541588b5112f029070e013987` (app version 1.91.1).
That fork pins the same frappe-ui version and links the same frozen Framework UI.
The production build, 365 frontend tests and 14 browser checks passed on this
baseline with the adapter. The upstream 1.92.0 revision above records the
original patch's provenance; this rebranding does not upgrade the stable fork.
