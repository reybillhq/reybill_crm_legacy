import { describe, it, expect } from 'vitest'
import { crmSwitcherApps } from '../../src/utils/appSwitcher'

describe('CRM app-switcher presentation', () => {
  it('uses app identity to exclude ERPNext and the current app', () => {
    const apps = [
      {
        name: 'erpnext',
        title: 'Localized ERP',
        route: '/desk',
        logo: '/erp.svg',
      },
      { name: 'crm', title: 'Localized CRM', route: '/crm' },
      { name: 'other', title: 'ERPNext', route: '/other' },
    ]
    const original = JSON.stringify(apps)
    const result = crmSwitcherApps(apps)
    expect(result.map((app) => app.name)).toEqual(['frappe', 'other'])
    expect(result[0]).toMatchObject({ title: 'ReyBill', route: '/desk' })
    expect(result[1].title).toBe('ERPNext')
    expect(JSON.stringify(apps)).toBe(original)
  })

  it('preserves permission-filtered Rental and newly registered app metadata', () => {
    const rental = Object.freeze({
      name: 'reybill_equipment_rental',
      title: 'Rental',
      route: '/rental',
      logo: '/rental.svg',
      custom: true,
    })
    const newlyInstalled = {
      name: 'new_app',
      title: 'New App',
      route: '/new',
      logo: '/new.svg',
    }
    expect(crmSwitcherApps([rental, newlyInstalled]).slice(1)).toEqual([
      rental,
      newlyInstalled,
    ])
    expect(
      crmSwitcherApps([newlyInstalled]).map((app) => app.name)
    ).not.toContain('reybill_equipment_rental')
  })

  it('handles fresh/empty registries, refreshes and translated labels', () => {
    expect(crmSwitcherApps(null)).toHaveLength(1)
    expect(crmSwitcherApps([])[0].route).toBe('/desk')
    const apps = [
      { name: 'frappe', title: 'Desk' },
      { name: 'erpnext', title: 'Anything' },
    ]
    expect(crmSwitcherApps(apps)).toHaveLength(1)
    expect(crmSwitcherApps(apps, (text) => `translated:${text}`)[0].title).toBe(
      'translated:ReyBill'
    )
    expect(crmSwitcherApps(apps)).toEqual(crmSwitcherApps(apps))
  })
})
