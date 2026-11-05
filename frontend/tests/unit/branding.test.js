import { describe, it, expect, vi } from 'vitest'
import { createApp, nextTick } from 'vue'
import branding from '../../src/branding'
import CRMLogo from '../../src/components/Icons/CRMLogo.vue'

const resource = vi.hoisted(() => ({ options: null }))
vi.mock('frappe-ui', () => ({
  createDocumentResource(options) {
    resource.options = options
    return {}
  },
}))
import { getSettings } from '../../src/stores/settings'

describe('ReyBill branding and tenant overrides', () => {
  it('shows ReyBill defaults before settings load and when overrides are cleared', () => {
    const { brand } = getSettings()
    expect(brand.name).toBe('ReyBill Sales')
    resource.options.onSuccess({})
    expect(brand.favicon).toBe(branding.iconLight)
  })

  it('retains configured customer branding and supports restoring defaults', () => {
    resource.options.onSuccess({
      brand_name: 'Customer Sales',
      brand_logo: '/files/logo.svg',
      favicon: '/files/favicon.png',
    })
    const { brand } = getSettings()
    expect(brand.name).toBe('Customer Sales')
    expect(brand.logo).toBe('/files/logo.svg')
    expect(brand.favicon).toBe('/files/favicon.png')
    resource.options.onSuccess({ brand_name: '', brand_logo: '', favicon: '' })
    expect(brand.name).toBe(branding.productName)
    expect(brand.favicon).toBe(branding.iconLight)
  })

  it('treats a saved upstream product name as the inherited default', () => {
    resource.options.onSuccess({ brand_name: 'Frappe CRM' })
    expect(getSettings().brand.name).toBe(branding.productName)
    resource.options.onSuccess({ brand_name: 'Customer CRM' })
    expect(getSettings().brand.name).toBe('Customer CRM')
    resource.options.onSuccess({})
  })

  it('uses the supplied theme variants and switches artwork without modifying it', async () => {
    const host = document.createElement('div')
    const app = createApp(CRMLogo, { wordmark: true, class: 'h-24 w-32' })
    app.mount(host)
    await nextTick()
    expect(host.querySelector('[role="img"]').getAttribute('aria-label')).toBe(
      branding.productName
    )
    expect(host.querySelector('img.dark\\:hidden').getAttribute('src')).toBe(
      branding.logoLight
    )
    expect(host.querySelector('img.dark\\:block').getAttribute('src')).toBe(
      branding.logoDark
    )
    expect(host.querySelectorAll('img.object-contain')).toHaveLength(2)
    app.unmount()
  })
})
