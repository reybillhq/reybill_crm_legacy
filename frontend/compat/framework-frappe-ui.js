// All current APIs still come from CRM's exactly pinned frappe-ui package.
export * from 'frappe-ui'
// Only the older linked @framework/ui source needs this removed export.
export { default as FeatherIcon } from './FeatherIcon.vue'
