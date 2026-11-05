# ReyBill CRM

ReyBill CRM is ReyBill's sales CRM for managing leads, deals, contacts,
organizations and pipelines. It is built on the open-source Frappe CRM project
and Frappe Framework, with integration support for ReyBill ERP (ERPNext).

[ReyBill](https://reybill.com) · [Source code](https://github.com/reybillhq/reybill_crm)

For the ReyBill Press App Manager, select branch **`release/v0.0.2`**.
See [Press installation and existing CRM replacement](docs/PRESS_INSTALLATION.md).

The ReyBill documentation portal is planned. Product help links remain hidden
until corresponding articles are available.

## Development

The internal Frappe app and Python package name remain `crm`. Use a Frappe v16
bench with the compatible ERPNext v16 app when validating ERP integration.
A standard bench may keep this checkout at `apps/crm`. In this development bench,
the active editable package and CRM asset link point to `apps/reybill_crm`; the
original dirty `apps/crm` checkout is preserved. See [activation and rollback](docs/branding/ACTIVATION.md)
before changing that binding. Build this fork explicitly when maintaining the local setup.

```sh
bench get-app --branch release/v0.0.2 crm https://github.com/reybillhq/reybill_crm.git
bench --site your-test-site install-app crm
cd apps/crm/frontend
yarn install --frozen-lockfile
yarn test:run
yarn build
```

Follow [AGENTS.md](AGENTS.md) and the existing scripting contracts in `.pi/`.
The scoped Framework UI adapter in `frontend/compat/` supports the locked
Framework UI and frappe-ui versions without changing the Framework application.
See its README for provenance, regression tests and removal conditions.

## Branding and review

Customer-facing defaults are centralized in `crm/branding.json`. Existing
FCRM Settings brand name, logo and favicon overrides remain supported.
Official ReyBill artwork is copied unchanged from ReyBill Core; see
[the audit](docs/branding/AUDIT.md) for inventory, compatibility, asset provenance,
validation and release requirements.

## License and upstream attribution

Based on [Frappe CRM](https://github.com/frappe/crm).
Copyright Frappe Technologies Pvt. Ltd. and contributors. Original notices and
third-party licenses are retained. This application is licensed under the
[GNU Affero General Public License v3](LICENSE).

The About dialog exposes the corresponding source repository. Before offering
this modified version over a network, publish the exact deployed revision and
make its corresponding source accessible to those users. Do not ship a source
link pointing at an unavailable or different revision. Framework, ERPNext and
third-party libraries retain their original identities and licenses.
