import { describe, it, expect } from 'vitest'
import {
  services,
  customProviderFields,
} from '../../src/components/Settings/emailConfig'
import branding from '../../src/branding'

describe('mail provider display and stored configuration', () => {
  it('shows a neutral mail-server label while retaining the exact integration key', () => {
    const provider = services.find((service) => service.name === 'Frappe Mail')
    expect(provider.label).toBe(branding.mailProviderLabel)
    expect(provider.info).not.toMatch(/Frappe|ERPNext/)
    expect(provider.custom).toBe(true)
    expect(
      customProviderFields.find((field) => field.name === 'frappe_mail_site')
        .label
    ).toBe(branding.mailProviderSiteLabel)
    expect(customProviderFields.map((field) => field.name)).toEqual(
      expect.arrayContaining(['frappe_mail_site', 'api_key', 'api_secret'])
    )
  })
})
