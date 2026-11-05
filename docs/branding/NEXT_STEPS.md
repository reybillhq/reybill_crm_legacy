# Before the first ReyBill Sales release

1. Review the feature branch and corresponding source link; do not merge, release or deploy automatically. At release, keep the exact deployed corresponding source revision publicly available and update the source link if branch ownership or release policy changes.
2. Schedule an isolated staging installation/update using the fork as internal app `crm`, carrying the compatibility patch. Back up that site, follow normal migration/build steps, and review any saved custom brand overrides and legacy menu/workspace records. Do not replace the protected active checkout as an incidental release step.
3. Validate live ERP synchronization, customer/quotation creation and permissions on a dedicated configured test site. Test same-site and remote API-key modes without contacting customer production systems.
4. Decide whether ReyBill Sales should retain Framework telemetry to `pulse.m.frappe.cloud`, disable it specifically for CRM, or use an approved ReyBill destination. Preserve accurate consent language for whichever provider is used. The rebranding did not change the shared System Settings preference.
5. Complete create/save/convert workflows, invitation delivery and applicable external integrations on disposable fixtures or a dedicated staging database. Extend Arabic RTL/linguistic and accessibility checks and the browser/device matrix.
6. Supply approved size-specific/maskable PWA artwork and launch screens if required. Existing official artwork is used unchanged; no fabricated maskable replacement or converted logo was introduced. Validate installed-app names/icons and update behavior on Android/iOS and existing service-worker/browser caches; define offline scope requirements separately.
7. Keep optional help/support links hidden until real ReyBill destinations exist. Publish and verify documentation articles before enabling any planned docs.reybill.com link.

The code and review artifacts are ready for review. These release checks remain explicit limits, not a production-readiness certification.
