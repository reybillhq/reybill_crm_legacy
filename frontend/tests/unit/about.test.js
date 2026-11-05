import { createApp, h, nextTick } from 'vue'
import { describe, it, expect, vi } from 'vitest'
import branding from '../../src/branding'
import source from '../stubs/legalSource'
import { verifiedSocialLinks } from '../../src/utils/socialLinks'

vi.mock('frappe-ui', () => {
  const Dialog = (props, { slots }) => h('section', slots.default?.())
  Dialog.Title = (props, { slots }) => slots.default?.()
  return { Dialog }
})
import AboutModal from '../../src/components/Modals/AboutModal.vue'
import LegalNoticesContent from '../../src/components/Settings/LegalNoticesContent.vue'

async function mount(component) {
  const host = document.createElement('div')
  const app = createApp(component, { modelValue: true })
  app.config.globalProperties.__ = globalThis.__
  app.mount(host)
  await nextTick()
  return { host, cleanup: () => app.unmount() }
}

describe('customer About and separate legal notices', () => {
  it('shows dynamic version and only product identity and the three requested links', async () => {
    window.crm_version = '9.8.7-test'
    const { host, cleanup } = await mount(AboutModal)
    expect(host.querySelector('h3').textContent).toBe(branding.productName)
    expect(host.querySelector('[data-crm-version]').textContent).toContain(
      '9.8.7-test'
    )
    expect(host.querySelector('img').getAttribute('src')).toBe(branding.appIcon)
    expect(host.textContent).toContain('ReyBill Technologies Ltd.')
    expect(
      [...host.querySelectorAll('a')].map((a) => [
        a.textContent.trim(),
        a.getAttribute('href'),
      ])
    ).toEqual([
      ['Website', 'https://reybill.com'],
      ['Documentation', 'https://docs.reybill.com'],
      ['Contact Support', 'https://console.reybill.com/console/support'],
    ])
    expect(host.querySelector('details')).toBeNull()
    expect(host.textContent).not.toMatch(
      /GitHub|Source Code|Report an Issue|Frappe|Licenses|warranty/
    )
    expect(host.querySelector('[aria-label="Social media"]')).toBeNull()
    expect(host.querySelector('button[aria-label="Close"]')).not.toBeNull()
    cleanup()
    delete window.crm_version
  })

  it('never fabricates an installed version', async () => {
    delete window.crm_version
    const { host, cleanup } = await mount(AboutModal)
    expect(host.querySelector('[data-crm-version]').textContent).toBe(
      'Version unavailable'
    )
    cleanup()
  })

  it('keeps attribution, rights, warranty, license and downloadable source outside About', async () => {
    const { host, cleanup } = await mount(LegalNoticesContent)
    expect(host.textContent).toContain(
      'Frappe Technologies Pvt. Ltd. and contributors'
    )
    expect(host.textContent).toMatch(/copy, modify and redistribute/)
    expect(host.textContent).toMatch(/no warranty/)
    expect(host.textContent).toMatch(/at no charge/)
    expect(
      [...host.querySelectorAll('a')].map((a) => a.getAttribute('href'))
    ).toEqual([
      '/assets/crm/frontend/legal/AGPL-3.0.txt',
      source.sourceUrl,
      source.archiveUrl,
      '/assets/crm/frontend/legal/THIRD_PARTY_NOTICES.txt',
    ])
    cleanup()
  })
})

describe('centrally configured official social links', () => {
  it('omits unverified, unsafe, unknown and placeholder accounts', () => {
    expect(
      verifiedSocialLinks([
        { platform: 'linkedin', url: 'https://linkedin.com/company/test' },
        { platform: 'instagram', verified: true, url: 'javascript:alert(1)' },
        { platform: 'facebook', verified: true, url: 'https://facebook.com/#' },
        {
          platform: 'youtube',
          verified: true,
          url: 'https://youtube.com.evil.test/channel/test',
        },
        {
          platform: 'unknown',
          verified: true,
          url: 'https://example.com/test',
        },
        {
          platform: 'x',
          verified: true,
          url: 'https://account:secret@x.com/test',
        },
      ])
    ).toEqual([])
  })
  it('preserves verified accounts and accessible platform labels without duplicates', () => {
    expect(
      verifiedSocialLinks([
        {
          platform: 'linkedin',
          verified: true,
          url: 'https://www.linkedin.com/company/test-fixture',
        },
        {
          platform: 'linkedin',
          verified: true,
          url: 'https://www.linkedin.com/company/duplicate',
        },
        { platform: 'x', verified: true, url: 'https://x.com/test_fixture' },
      ])
    ).toEqual([
      {
        platform: 'linkedin',
        label: 'LinkedIn',
        url: 'https://www.linkedin.com/company/test-fixture',
      },
      {
        platform: 'x',
        label: 'X (Twitter)',
        url: 'https://x.com/test_fixture',
      },
    ])
  })
})
