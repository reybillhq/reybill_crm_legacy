import { usePageMeta as useFrameworkPageMeta } from 'frappe-ui'
import { getSettings } from '@/stores/settings'
import branding from '@/branding'

export function usePageMeta(getMeta) {
  const { brand } = getSettings()
  return useFrameworkPageMeta(() => {
    const meta = getMeta()
    if (!meta) return meta
    const name = brand.name || branding.productName
    return {
      ...meta,
      title:
        meta.title && meta.title !== name ? `${meta.title} | ${name}` : name,
      icon: meta.icon || brand.favicon || branding.iconLight,
    }
  })
}
