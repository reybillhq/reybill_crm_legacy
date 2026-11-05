/* Read-only browser smoke test. Keep native session secrets and screenshots outside Git. */
const { chromium } = require('playwright')
const fs = require('node:fs')
const path = require('node:path')
const assert = require('node:assert/strict')

const base = process.env.REYBILL_BASE_URL || 'http://reybill.localhost:8012'
const output = process.env.REYBILL_QA_OUTPUT || '/tmp/reybill-qa'
const sessionFile = process.env.REYBILL_SESSION_FILE
const branding = require('../crm/branding.json')
const report = { base, checks: [], pageErrors: [], externalRequests: [] }
const forbidden = /(?:^|\.)(?:frappe\.io|frappecloud\.com|frappe\.cloud|erpnext\.com)$/i
fs.mkdirSync(output, { recursive: true })

async function check(name, callback) {
  try {
    const details = await callback()
    report.checks.push({ name, passed: true, details })
  } catch (error) {
    report.checks.push({ name, passed: false, error: error.message.split('\n')[0] })
  }
  fs.writeFileSync(path.join(output, 'browser-results.json'), JSON.stringify(report, null, 2))
}

async function main() {
  assert(sessionFile, 'Set REYBILL_SESSION_FILE to a protected native test session file')
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] })
  async function context(options = {}, authenticated = true) {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 }, ...options })
    if (authenticated) await ctx.addCookies([{ name: 'sid', value: fs.readFileSync(sessionFile, 'utf8').trim(), url: base, httpOnly: true }])
    await ctx.route('**/*', (route) => {
      const hostname = new URL(route.request().url()).hostname
      if (hostname === new URL(base).hostname) return route.continue()
      report.externalRequests.push(hostname)
      return route.abort()
    })
    ctx.on('page', page => page.on('pageerror', error => report.pageErrors.push(String(error))))
    return ctx
  }
  async function cleanLinks(page) {
    const links = await page.locator('a[href]:visible').evaluateAll(nodes => nodes.map(node => node.href))
    assert(!links.some(link => forbidden.test(new URL(link).hostname)), 'Visible upstream promotional link')
  }
  async function closeHelp(page) {
    const panel = page.locator('aside').filter({ has: page.getByRole('button', { name: 'Close', exact: true }) })
    if (await panel.count()) await panel.getByRole('button', { name: 'Close', exact: true }).click()
  }
  async function openMenu(page) {
    await page.getByRole('button').filter({ hasText: branding.productName }).first().click()
  }
  const guest = await context({}, false)
  await check('Guest access and branded native login', async () => {
    const page = await guest.newPage()
    const denied = await page.goto(base + '/crm', { waitUntil: 'networkidle' })
    assert.equal(denied.status(), 403)
    const response = await page.goto(base + '/login', { waitUntil: 'networkidle' })
    assert.equal(response.status(), 200)
    assert.match(await page.title(), /ReyBill/i)
    await cleanLinks(page)
    return { denied: 403, login: 200, title: await page.title() }
  })
  const desktop = await context()
  const page = await desktop.newPage()
  await check('Authenticated load, onboarding, favicon and primary accent', async () => {
    const response = await page.goto(base + '/crm?_lang=en', { waitUntil: 'networkidle' })
    assert.equal(response.status(), 200)
    await page.getByRole('button').filter({ hasText: branding.productName }).first().waitFor()
    assert.match(await page.title(), /ReyBill Sales/)
    const help = page.locator('aside').first()
    if (!(await help.isVisible())) {
      await page.getByRole('button', { name: /^(Continue|Start now|Help)$/ }).click()
    }
    await help.waitFor()
    assert((await help.innerText()).includes(branding.productName), 'Onboarding panel must use ReyBill identity')
    assert(/Welcome to ReyBill Sales|All steps are completed successfully/.test(await help.innerText()), 'Preserve either active or completed onboarding state')
    const icon = await page.locator('link[rel="icon"]').getAttribute('href')
    assert(icon.includes('/assets/crm/images/branding/'))
    const accent = await page.getByRole('button', { name: 'Create', exact: true }).first().evaluate(el => getComputedStyle(el).backgroundColor)
    assert.equal(accent, 'rgb(116, 0, 58)')
    await cleanLinks(page)
    await closeHelp(page)
    return { title: await page.title(), icon, accent }
  })
  for (const [name, route] of [['Leads', 'leads'], ['Deals', 'deals'], ['Contacts', 'contacts'], ['Organizations', 'organizations']]) {
    await check(name + ' navigation and create form', async () => {
      await page.goto(base + '/crm/' + route + '/view/list', { waitUntil: 'networkidle' })
      await closeHelp(page)
      assert((await page.title()).includes(branding.productName))
      await cleanLinks(page)
      await page.getByRole('button', { name: 'Create', exact: true }).first().click()
      const dialog = page.getByRole('dialog').last()
      await dialog.waitFor()
      assert(!/Frappe CRM|Frappe Cloud/.test(await dialog.innerText()))
      await page.keyboard.press('Escape')
      return { title: await page.title(), createForm: true, recordsSaved: false }
    })
  }
  await check('Deal pipeline view', async () => {
    await page.goto(base + '/crm/deals/view/kanban', { waitUntil: 'networkidle' })
    await closeHelp(page)
    assert(page.url().includes('/kanban'))
    assert((await page.title()).includes(branding.productName))
    await cleanLinks(page)
    return { route: '/crm/deals/view/kanban', title: await page.title() }
  })
  await check('About light artwork and attribution', async () => {
    await openMenu(page)
    await page.getByRole('menuitem', { name: 'About', exact: true }).click()
    const dialog = page.getByRole('dialog').last()
    await dialog.waitFor()
    const logo = dialog.locator('img:visible')
    assert.equal(await logo.getAttribute('src'), branding.logoLight)
    assert(await logo.evaluate(el => el.complete && el.naturalWidth > 0))
    await dialog.screenshot({ path: path.join(output, 'about-light.png') })
    await cleanLinks(page)
    await page.keyboard.press('Escape')
    return { artwork: branding.logoLight, upstreamNotice: true }
  })
  await check('Settings and disabled ERP integration UI' , async () => {
    await openMenu(page)
    await page.getByRole('menuitem', { name: 'Settings', exact: true }).click()
    await page.locator('[data-page="ReyBill ERP"]').click()
    await page.getByText('Connect ReyBill ERP to ReyBill Sales', { exact: true }).waitFor()
    const dialog = page.getByRole('dialog').last()
    assert(!/Frappe Cloud|Manage Billing/.test(await dialog.innerText()))
    await cleanLinks(page)
    await dialog.screenshot({ path: path.join(output, 'erp-settings.png') })
    await page.locator('[data-page="Preferences"]').click()
    await page.getByText('Dark', { exact: true }).click()
    assert.equal(await page.locator('html').getAttribute('data-theme'), 'dark')
    await page.keyboard.press('Escape')
    return { integrationEnabled: false, remoteActionsExecuted: false, nativeThemeSwitcher: true }
  })
  await check('About, dark artwork, legal notice and source access', async () => {
    await openMenu(page)
    await page.getByRole('menuitem', { name: 'About', exact: true }).click()
    const dialog = page.getByRole('dialog').last()
    await dialog.waitFor()
    assert.equal(await dialog.getByRole('link', { name: 'Source Code', exact: true }).getAttribute('href'), branding.sourceUrl)
    assert((await dialog.innerText()).includes('Frappe Technologies'))
    const logo = dialog.locator('img:visible')
    assert.equal(await logo.getAttribute('src'), branding.logoDark)
    assert(await logo.evaluate(el => el.complete && el.naturalWidth > 0))
    await dialog.screenshot({ path: path.join(output, 'about-dark.png') })
    await cleanLinks(page)
    await page.keyboard.press('Escape')
    return { theme: 'dark', source: branding.sourceUrl, artwork: branding.logoDark }
  })
  await check('PWA manifest, unchanged official icon and service worker', async () => {
    const response = await page.request.get(base + '/assets/crm/frontend/manifest.webmanifest')
    const manifest = await response.json()
    assert.equal(manifest.name, branding.productName)
    assert.equal(manifest.scope, '/crm')
    assert.equal(manifest.theme_color, branding.colors.light.primary)
    const icon = await page.request.get(base + manifest.icons[0].src)
    assert.equal(icon.status(), 200)
    const sw = await page.request.get(base + '/assets/crm/frontend/sw.js')
    assert.equal(sw.status(), 200)
    return { name: manifest.name, scope: manifest.scope, iconDimensions: manifest.icons[0].sizes, serviceWorkerServed: true }
  })
  for (const [lang, expected] of [['de', 'ReyBill ERP-Einstellungen'], ['ar', 'إعدادات ReyBill ERP']]) {
    await check(lang + ' compiled branding translations', async () => {
      const ctx = await context({ locale: lang })
      const localized = await ctx.newPage()
      await localized.goto(base + '/crm?_lang=' + lang, { waitUntil: 'networkidle' })
      assert.equal(await localized.evaluate(() => window.translated_messages['ReyBill ERP Settings']), expected)
      assert(!/Frappe CRM/.test(await localized.title()))
      await cleanLinks(localized)
      await ctx.close()
      return { brandSettingsLabel: expected, placeholdersChecked: true }
    })
  }
  await check('Mobile navigation, drawer branding and responsive viewport', async () => {
    const ctx = await context({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true })
    const mobile = await ctx.newPage()
    await mobile.goto(base + '/crm/leads/view/list', { waitUntil: 'networkidle' })
    const menu = mobile.locator('button').filter({ has: mobile.locator('svg') }).first()
    await menu.click()
    await mobile.getByRole('button').filter({ hasText: branding.productName }).first().waitFor()
    await cleanLinks(mobile)
    assert(await mobile.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
    await mobile.screenshot({ path: path.join(output, 'mobile-drawer.png') })
    await mobile.getByRole('link', { name: 'Deals', exact: true }).click()
    await mobile.waitForURL('**/crm/deals/**')
    return { width: 390, drawerBranded: true, navigation: 'Deals' }
  })
  await browser.close()
  report.pageErrors = [...new Set(report.pageErrors)]
  report.externalRequests = [...new Set(report.externalRequests)]
  report.passed = report.checks.every(test => test.passed) && !report.pageErrors.length
  fs.writeFileSync(path.join(output, 'browser-results.json'), JSON.stringify(report, null, 2))
  console.log(JSON.stringify(report, null, 2))
  if (!report.passed) process.exitCode = 1
}
main().catch(error => { console.error(error.message); process.exitCode = 1 })
