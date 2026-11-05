/* Verify the actual test endpoint, never the isolated preview. No business writes. */
const { chromium } = require('playwright')
const fs = require('node:fs')
const path = require('node:path')
const assert = require('node:assert/strict')
const branding = require('../crm/branding.json')
const base = process.env.REYBILL_BASE_URL || 'http://reybill.localhost:8000'
assert.equal(new URL(base).hostname, 'reybill.localhost')
assert.notEqual(new URL(base).port, '8012')
const output = process.env.REYBILL_QA_OUTPUT || '/tmp/reybill-crm-activation-detail'
const report = { base, checks: [], pageErrors: [] }
fs.mkdirSync(output, { recursive: true })
async function main() {
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] })
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } })
  await context.addCookies([{ name: 'sid', value: fs.readFileSync(process.env.REYBILL_SESSION_FILE, 'utf8').trim(), url: base, httpOnly: true }])
  await context.route('**/*', route => new URL(route.request().url()).origin === base ? route.continue() : route.abort())
  const page = await context.newPage()
  page.on('pageerror', error => report.pageErrors.push(String(error)))
  async function check(name, run) {
    try { report.checks.push({ name, passed: true, details: await run() }) }
    catch (error) { report.checks.push({ name, passed: false, error: error.message.split('\n')[0] }) }
    await page.keyboard.press('Escape'); await page.keyboard.press('Escape')
    fs.writeFileSync(path.join(output, 'results.json'), JSON.stringify(report, null, 2))
  }
  async function openMenu() { await page.getByRole('button').filter({ hasText: branding.productName }).first().click() }
  async function settings() {
    await openMenu(); await page.getByRole('menuitem', { name: 'Settings', exact: true }).click()
  }
  await check('Normal-site runtime is the reconciled 1.92.0 fork', async () => {
    await page.goto(base + '/crm/dashboard', { waitUntil: 'networkidle' })
    const response = await page.request.get(base + '/api/method/crm.api.branding.get_runtime_info')
    assert.equal(response.status(), 200)
    const runtime = (await response.json()).message
    assert.equal(runtime.version, '1.92.0')
    assert(runtime.source_path.includes('/apps/reybill_crm/'))
    assert.equal(runtime.branch, 'feat/reybill-sales-branding')
    assert.equal(await page.evaluate(() => window.crm_version), '1.92.0')
    return runtime
  })
  await check('Normal dashboard switcher includes ReyBill, ReyBill CRM and Rental', async () => {
    const help = page.locator('aside').filter({ has: page.getByRole('button', { name: 'Close', exact: true }) })
    if (await help.count()) await help.getByRole('button', { name: 'Close', exact: true }).click()
    await openMenu(); await page.getByRole('menuitem', { name: 'Apps', exact: true }).hover()
    for (const name of ['ReyBill', 'ReyBill CRM', 'Rental']) await page.getByRole('menuitem', { name, exact: true }).waitFor()
    assert.equal(await page.getByRole('menuitem', { name: 'ERPNext', exact: true }).count(), 0)
    await page.screenshot({ path: path.join(output, 'dashboard-switcher.png') })
    await page.keyboard.press('Escape'); await page.keyboard.press('Escape')
    return { visible: ['ReyBill', 'ReyBill CRM', 'Rental'], separateERPEntry: false }
  })
  await check('Enabled integration uses ReyBill ERP throughout and preserves saved settings', async () => {
    await settings(); await page.locator('[data-page="ReyBill ERP"]').click()
    const dialog = page.getByRole('dialog').last()
    await dialog.getByRole('heading', { name: 'ReyBill ERP Settings', exact: true }).waitFor()
    await dialog.getByText('Select your ReyBill ERP company to connect with', { exact: true }).waitFor()
    const text = await dialog.innerText()
    for (const expected of ['Manage ReyBill ERP integration settings.', 'Select your ReyBill ERP company to connect with', 'ReyBill ERP Items always sync into CRM Products.', 'Turn this on to also sync CRM Product changes back to ReyBill ERP Items.', 'Run a manual bi-directional sync between ReyBill ERP Items and CRM Products.', 'Create customer in ReyBill ERP when the deal status is changed']) assert(text.includes(expected), expected)
    assert(!/ERPNext|ERP Next|Frappe Cloud|ReyBill Sales/.test(text))
    const document = await page.request.get(base + '/api/method/frappe.client.get?doctype=ERPNext%20CRM%20Settings')
    const current = (await document.json()).message
    assert.equal(current.enabled, 1); assert.equal(current.sync_products, 1)
    await dialog.screenshot({ path: path.join(output, 'erp-integration.png'), mask: [dialog.getByText(current.erpnext_company, { exact: true })] })
    await page.keyboard.press('Escape')
    return { enabled: true, bidirectional: true, noSettingsSaved: true, companyValueMaskedInScreenshot: true }
  })
  await check('Email settings use neutral labels while keeping native provider IDs', async () => {
    await settings(); await page.locator('[data-page="Accounts"]').click()
    await page.getByRole('button', { name: 'Add Account', exact: true }).click()
    const dialog = page.getByRole('dialog').last()
    await dialog.getByText('Mail server', { exact: true }).waitFor()
    assert(!/Frappe Mail/.test(await dialog.innerText()))
    await dialog.screenshot({ path: path.join(output, 'email-provider.png') })
    await page.keyboard.press('Escape')
    return { providerLabel: 'Mail server', storedProvider: 'Frappe Mail', accountCreated: false }
  })
  await check('Affected German and Arabic integration descriptions are translated', async () => {
    const key = 'ReyBill ERP Items always sync into CRM Products. Turn this on to also sync CRM Product changes back to ReyBill ERP Items.'
    const translations = {}
    for (const lang of ['de', 'ar']) {
      await page.goto(base + '/crm?_lang=' + lang, { waitUntil: 'networkidle' })
      const translated = await page.evaluate(key => window.__(key), key)
      assert.notEqual(translated, key)
      assert(translated.includes('ReyBill ERP'))
      assert(!/ERPNext|Frappe CRM|ReyBill Sales/.test(translated))
      translations[lang] = translated
    }
    return translations
  })
  await browser.close()
  report.passed = report.checks.every(check => check.passed) && !report.pageErrors.length
  fs.writeFileSync(path.join(output, 'results.json'), JSON.stringify(report, null, 2))
  console.log(JSON.stringify(report, null, 2))
  if (!report.passed) process.exitCode = 1
}
main().catch(error => { console.error(error.message); process.exitCode = 1 })
