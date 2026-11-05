# ReyBill CRM About dialog

About displays the unchanged official CRM SVG, ReyBill CRM, the installed
backend version, ReyBill Technologies Ltd., Website, Documentation and Contact
Support. It uses native dialog focus handling and the existing Core-derived
color tokens. No developer links, upstream description or license disclosure
appears in About.

## Legal Notices

A permanent **Legal Notices** user-menu entry is available to every CRM user on
desktop and mobile, independently of configurable standard menu items. The same
content is under **Settings → Legal Notices**, in User Configuration with no
manager-role restriction. Both information dialogs wait for the native mobile
drawer to close, preserving keyboard focus and dismissal. It includes original Frappe CRM attribution, ReyBill
modification attribution, AGPLv3 rights and warranty notice, the complete local
AGPLv3 license, an immutable source permalink and downloadable source archive,
and bundled dependency license/notice texts with package versions and source
locations. Original repository licenses, copyright headers and author metadata
are preserved.

This placement follows the license's definition of appropriate legal notices
(a convenient, prominent menu item) and AGPLv3 section 13's network-user source
offer. Consult the [GNU license FAQ](https://www.gnu.org/licenses/gpl-faq.en.html)
and the repository's original [AGPLv3 text](../../LICENSE). The notices and source
offer remain accessible outside About; they are not gated by administrator
permissions or hidden in a collapsed attribution control.

`frontend/legal-notices-plugin.js` derives notices from bundled module paths,
including transitive packages, and explicitly includes generated Lucide and
Workbox code plus aliased Framework UI and the CRM compatibility shim. The
build fails if a package lacks a license notice. Two npm packages omit their
original license files; exact-release upstream copies and provenance are in
`frontend/legal/upstream`. The generated `legal/AGPL-3.0.txt` is byte-identical
to LICENSE. `legal/source.json` and the rendered source links use the build's
Git commit, so the source offer does not depend on a moving branch. Publish the
commit in the configured public repository before activating a new build.

## Links and social configuration

Primary links are centralized in `crm/branding.json`:

| Display name | URL | Verification |
| --- | --- | --- |
| Website | https://reybill.com | HTTP 200 |
| Documentation | https://docs.reybill.com | HTTP 404 at implementation time; requested destination retained |
| Contact Support | https://console.reybill.com/console/support | HTTP 200 sign-in redirect preserving the support destination |

No official social-account URLs were found in ReyBill Core or project
configuration. The official website's social links were placeholders. The
central `socialLinks` array therefore remains empty, and About has no empty
social section. Future entries require `platform`, `url` and `verified: true`
after checking account ownership against an authoritative ReyBill source.
Supported icons are LinkedIn, Instagram, Facebook, YouTube and X (Twitter),
using existing Feather artwork. URL validation and accessible platform labels
are shared in `src/utils/socialLinks.js`; validation does not establish account
ownership.

## Build and verification

The default frontend build still writes the normal CRM assets and HTML entry.
For a staged build, set `CRM_BUILD_DIR` and `CRM_BUILD_HTML` to private staging
paths. This avoids changing the active test assets before the build passes.

Run `yarn --cwd frontend test:run`, lint changed frontend files, and build the
frontend. `scripts/verify_about.cjs` checks the normal test endpoint's runtime
identity, exact links, minimal About content, keyboard focus and Escape,
light/dark/mobile layouts, both legal entry points, exact source commit, local
license downloads and read-only list navigation. Supply `REYBILL_SESSION_FILE`
and `REYBILL_QA_OUTPUT` through the environment. Session secrets, screenshots
and detailed runtime evidence must stay outside Git.
