/* Authenticated, read-only development checks. Keep session files outside Git. */
const { chromium } = require('playwright')
const fs = require('node:fs')
const path = require('node:path')
const assert = require('node:assert/strict')
const branding = require('../crm/branding.json')
const base = process.env.REYBILL_BASE_URL || 'http://reybill.localhost:8012'
const output = process.env.REYBILL_QA_OUTPUT || '/tmp/reybill-crm-switcher-qa'
const report = { base, checks: [], pageErrors: [] }
fs.mkdirSync(output, { recursive: true })
async function check(name, run) {
  try { report.checks.push({ name, passed: true, details: await run() }) }
  catch (error) { report.checks.push({ name, passed: false, error: error.message.split('\n')[0] }) }
  fs.writeFileSync(path.join(output, 'results.json'), JSON.stringify(report, null, 2))
}
async function main() {
  const sid = fs.readFileSync(process.env.REYBILL_SESSION_FILE, 'utf8').trim()
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] })
  async function context(session) {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 } })
    await ctx.addCookies([{ name: 'sid', value: session, url: base, httpOnly: true }])
    await ctx.route('**/*', route => new URL(route.request().url()).origin === base ? route.continue() : route.abort())
    ctx.on('page', page => page.on('pageerror', error => report.pageErrors.push({url: page.url(), message: String(error), stack: error.stack?.split('\n').slice(0, 3)})))
    return ctx
  }
  async function menu(page) {
    await page.getByRole('button').filter({ hasText: branding.productName }).first().click()
    await page.getByRole('menuitem', { name: 'Apps', exact: true }).hover()
    await page.getByRole('menuitem', { name: 'ReyBill', exact: true }).waitFor()
  }
  async function registry(page) {
    const response = await page.request.get(base + '/api/method/frappe.apps.get_apps')
    assert.equal(response.status(), 200)
    return (await response.json()).message
  }
  const ctx = await context(sid)
  const page = await ctx.newPage()
  await page.goto(base + '/crm', { waitUntil: 'networkidle' })
  await check('Native registry remains intact; ERPNext hidden only in CRM menu', async () => {
    const apps = await registry(page)
    assert(apps.some(app => app.name === 'erpnext'))
    assert(apps.some(app => app.name === 'crm'))
    await menu(page)
    assert.equal(await page.getByRole('menuitem', { name: 'ERPNext', exact: true }).count(), 0)
    assert.equal(await page.getByRole('menuitem', { name: 'ReyBill ERP', exact: true }).count(), 0)
    for (const app of apps.filter(app => !branding.excludedSwitcherApps.includes(app.name))) {
      await page.getByRole('menuitem', { name: app.title, exact: true }).waitFor()
    }
    await page.getByRole('menu').last().screenshot({ path: path.join(output, 'app-switcher.png') })
    await page.keyboard.press('Escape'); await page.keyboard.press('Escape')
    return { nativeERPEntryPreserved: true, crmERPEntryAbsent: true }
  })
  await check('ReyBill click opens native functional Desk', async () => {
    await menu(page)
    await page.getByRole('menuitem', { name: 'ReyBill', exact: true }).click()
    await page.waitForURL(url => url.pathname === '/desk' || url.pathname.startsWith('/desk/'))
    await page.waitForFunction(() => !!window.frappe?.boot?.user)
    assert.equal((await page.request.get(base + '/desk')).status(), 200)
    return { route: '/desk', nativeBootLoaded: true }
  })
  await check('Rental click preserves registered route and functional app', async () => {
    await page.goto(base + '/crm', { waitUntil: 'networkidle' })
    const rental = (await registry(page)).find(app => app.name === 'reybill_equipment_rental')
    assert(rental)
    await menu(page)
    await page.getByRole('menuitem', { name: rental.title, exact: true }).click()
    await page.waitForURL(url => url.pathname === rental.route)
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)
    assert.equal((await page.request.get(base + rental.route)).status(), 200)
    assert(!/Not Found|Internal Server Error/.test(await page.title()))
    return { route: rental.route, status: 200 }
  })
  await check('Refresh ignores stale app cache and retains current branding', async () => {
    await page.goto(base + '/crm', { waitUntil: 'networkidle' })
    await page.evaluate(async () => {
      localStorage.setItem('crm-branding-cache-test', 'Frappe CRM / ReyBill Sales')
      const request = indexedDB.open('keyval-store', 1)
      await new Promise((resolve, reject) => {
        request.onupgradeneeded = () => { const db = request.result; if (!db.objectStoreNames.contains('keyval')) db.createObjectStore('keyval') }
        request.onsuccess = () => {
          const db = request.result
          if (!db.objectStoreNames.contains('keyval')) { db.close(); resolve(); return }
          const transaction = db.transaction('keyval', 'readwrite')
          transaction.objectStore('keyval').put(JSON.stringify([{ name: 'erpnext', title: 'ERPNext', route: '/desk' }]), '["apps"]')
          transaction.oncomplete = () => { db.close(); resolve() }
          transaction.onerror = reject
        }
        request.onerror = reject
      })
    })
    await page.reload({ waitUntil: 'networkidle' })
    assert((await page.title()).includes('ReyBill CRM'))
    await menu(page)
    assert.equal(await page.getByRole('menuitem', { name: 'ERPNext', exact: true }).count(), 0)
    assert.equal(await page.getByRole('menuitem', { name: 'Rental', exact: true }).count(), 1)
    await page.keyboard.press('Escape'); await page.keyboard.press('Escape')
    const registrations = await page.evaluate(async () => (await navigator.serviceWorker.getRegistrations()).map(r => ({ scope: r.scope, script: r.active?.scriptURL })))
    return { ordinaryReload: true, legacyCacheIgnored: true, registrations }
  })
  const roleSessions = process.env.REYBILL_ROLE_SESSIONS_FILE ? JSON.parse(fs.readFileSync(process.env.REYBILL_ROLE_SESSIONS_FILE, 'utf8')) : []
  for (const [index, session] of roleSessions.entries()) {
    await check(`Independent sales session ${index + 1}: native permissions and refreshed switcher`, async () => {
      const roleContext = await context(session.sid)
      const rolePage = await roleContext.newPage()
      const response = await rolePage.goto(base + '/crm', { waitUntil: 'networkidle' })
      assert.equal(response.status(), 200)
      const apps = await registry(rolePage)
      await menu(rolePage)
      const visible = apps.filter(app => !branding.excludedSwitcherApps.includes(app.name))
      for (const app of visible) await rolePage.getByRole('menuitem', { name: app.title, exact: true }).waitFor()
      assert.equal(await rolePage.getByRole('menuitem', { name: 'ERPNext', exact: true }).count(), 0)
      await rolePage.reload({ waitUntil: 'networkidle' }); await menu(rolePage)
      assert.equal(await rolePage.getByRole('menuitem', { name: 'ReyBill', exact: true }).count(), 1)
      await roleContext.close()
      return { nativePermissionFilteredApps: visible.map(app => app.name), refreshed: true }
    })
  }
  await browser.close()
  report.passed = report.checks.every(check => check.passed) && !report.pageErrors.length
  fs.writeFileSync(path.join(output, 'results.json'), JSON.stringify(report, null, 2))
  console.log(JSON.stringify(report, null, 2))
  if (!report.passed) process.exitCode = 1
}
main().catch(error => { console.error(error.message); process.exitCode = 1 })
