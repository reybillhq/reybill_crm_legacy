# ReyBill CRM 1.92.0 activation

The branded CRM fork is active and verified on the normal development site. The original CRM checkout and unrelated work are preserved. Detailed runtime evidence, screenshots and the environment-specific rollback script are retained privately with the operator.

## Version compatibility

The installed upstream release `638bf3db23e7142870819a213368e028866b79b1` differs from the branding baseline only in the version string. Merge `74422ef` incorporates that exact release into the existing feature branch. The Python app and distribution remain **1.92.0**, with no downgrade, dependency upgrade or schema migration. Existing compatibility implementation and locked dependencies are retained.

## Final behavior

- App switcher: ReyBill opens Desk, ReyBill CRM opens CRM, and Rental/other permission-granted apps retain their routes. The separate ERPNext entry is excluded by app ID.
- About: ReyBill CRM, official icon, dynamic installed version, ReyBill Technologies Ltd., verified destinations and a separate open-source legal section.
- Integration settings: ReyBill ERP naming throughout; existing settings, APIs, fields and functionality are preserved.
- Stored inherited field captions are adopted without changing their identities or overriding customer labels.
- Email/onboarding use neutral Mail server labels while preserving native provider values.
- Titles, icons, PWA, setup/help, messages and affected German/Arabic translations use the official identity.

The documentation portal is unavailable and its action stays hidden. Support uses the existing Core fallback until the protected console destination can be verified. Original AGPLv3 and author/third-party notices remain intact.

## Verification

- 371 frontend tests, 11 backend contracts and 4 Desktop tests passed.
- Production frontend and offline package build passed; changed frontend lint passed.
- 27 authenticated browser checks passed on the normal endpoint, including navigation, enabled ERP settings, fresh roles, reload/cache handling, themes and affected translations.
- Real bidirectional Item/Product sync and delete hooks passed before and after activation; all temporary test records were rolled back or removed.
- Source preservation, guarded metadata adoption, unchanged business data and unchanged integration configuration were verified privately.

The System Manager-only runtime diagnostic confirms the actual imported checkout, version and commit. Guest and Sales User access is denied. Frappe's directory-based native branch field is not used to identify the active fork.

## Recovery and maintenance

The private recovery snapshot includes the original editable package binding/metadata, CRM asset target/catalogs, original dirty source archives and targeted display metadata. Its prepared rollback restores those bindings and still-matching display defaults, clears caches and reloads affected Python services; ordinary rollback does not restore business data. The operator's private activation report contains the exact command and recovery location.

Work remains on `feat/reybill-sales-branding`. No production deployment, stable merge, release or force-push was performed. Build and maintain the active fork explicitly. Technical identifiers, inactive compatibility strings, translation contexts and legal attribution remain intentionally preserved; no unresolved product-branding issue was found in the verified customer flows.

[Changed files](ACTIVATION_FILES.md). Browser acceptance is reproducible with `scripts/validate_branding.cjs`, `scripts/verify_app_branding.cjs` and `scripts/verify_activation.cjs`, using protected session files supplied outside Git.
