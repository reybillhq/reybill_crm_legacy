import { createDocumentResource } from 'frappe-ui'
import { reactive, ref } from 'vue'
import branding from '@/branding'

const settings = ref({})
const brand = reactive({
  name: branding.productName,
  favicon: branding.iconLight,
})

const _settings = createDocumentResource({
  doctype: 'FCRM Settings',
  name: 'FCRM Settings',
  onSuccess: (data) => {
    settings.value = data
    getSettings().setupBrand()
    return data
  },
})

export function getSettings() {
  function setupBrand() {
    const name = settings.value?.brand_name
    brand.name =
      name && !['CRM', 'Frappe CRM'].includes(name)
        ? name
        : branding.productName
    brand.logo = settings.value?.brand_logo
    brand.favicon = settings.value?.favicon || branding.iconLight
  }

  return {
    _settings,
    settings,
    brand,
    setupBrand,
  }
}
