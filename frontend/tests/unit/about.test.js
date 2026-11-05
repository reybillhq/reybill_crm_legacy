import { createApp, h, nextTick } from 'vue'
import { describe, it, expect, vi } from 'vitest'
import branding from '../../src/branding'

vi.mock('frappe-ui', () => {
  const Dialog = (props, { slots }) => h('section', slots.default?.())
  Dialog.Title = (props, { slots }) => slots.default?.()
  return { Dialog }
})
import AboutModal from '../../src/components/Modals/AboutModal.vue'

describe('customer About and upstream attribution', () => {
  it('uses the running server version, official CRM icon, company and verified links', async () => {
    window.crm_version = '9.8.7-test'
    const host = document.createElement('div')
    const app = createApp(AboutModal, { modelValue: true })
    app.config.globalProperties.__ = globalThis.__
    app.mount(host)
    await nextTick()
    expect(host.querySelector('h3').textContent).toBe(branding.productName)
    expect(host.querySelector('[data-crm-version]').textContent).toContain(
      '9.8.7-test'
    )
    expect(host.querySelector('img').getAttribute('src')).toBe(branding.appIcon)
    expect(host.textContent).toContain('ReyBill Technologies Ltd.')
    const links = [...host.querySelectorAll('a')].map((a) =>
      a.getAttribute('href')
    )
    expect(links).toContain(branding.repository)
    expect(links).toContain(branding.support)
    expect(links).not.toContain('https://docs.reybill.com')
    expect(
      links.some((link) =>
        /frappe\.io|frappecloud\.com|github.com\/frappe\//.test(link)
      )
    ).toBe(false)
    expect(host.querySelector('details').textContent).toContain(
      'Frappe Technologies Pvt. Ltd.'
    )
    expect(host.querySelector('details').textContent).toContain('AGPLv3')
    app.unmount()
    delete window.crm_version
  })
})
