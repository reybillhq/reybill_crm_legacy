/* Native read-only icon QA. Session secrets and full-page images stay outside Git. */
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const base = process.env.REYBILL_ICON_BASE_URL || 'http://reybill.localhost:8000';
const expectedCommit = process.env.REYBILL_ICON_EXPECTED_COMMIT;
const local = new URL(base).hostname.endsWith('.localhost');
assert(local || /^[a-f0-9]{40}$/.test(expectedCommit || ''), 'Provide the exact expected commit for a remote test site');
const output = process.env.REYBILL_ICON_QA_OUTPUT || '/tmp/reybill-crm-icon-qa';
const source = fs.readFileSync(path.join(__dirname, '../crm/public/images/reybill-crm.svg'));
const hash = data => crypto.createHash('sha256').update(data).digest('hex');
const iconPath = '/assets/crm/images/reybill-crm.svg';
const report = { base, scope: local ? 'Local development site; not a verified Press deployment' : 'User-designated remote test site', expectedCommit, expectedIcon: iconPath, sourceSha256: hash(source), checks: [], pageErrors: [] };
fs.mkdirSync(output, { recursive: true });
async function check(name, run) {
  try { report.checks.push({ name, passed: true, details: await run() }); }
  catch (error) { report.checks.push({ name, passed: false, error: error.message }); }
  fs.writeFileSync(path.join(output, 'results.json'), JSON.stringify(report, null, 2));
}
(async () => {
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const sessionFile = process.env.REYBILL_ICON_SESSION_FILE || '/tmp/reybill-crm-icon-session';
  await context.addCookies([{ name: 'sid', value: fs.readFileSync(sessionFile, 'utf8').trim(), url: base, httpOnly: true }]);
  await context.route('**/*', route => new URL(route.request().url()).hostname === new URL(base).hostname ? route.continue() : route.abort());
  const page = await context.newPage();
  page.on('pageerror', error => report.pageErrors.push(String(error)));
  const tile = () => page.locator('.desktop-icon[data-id="ReyBill CRM"]:visible');
  async function verifyTile() {
    await tile().waitFor();
    assert.equal(await tile().count(), 1);
    assert.equal((await tile().locator('.icon-title').innerText()).trim(), 'ReyBill CRM');
    const image = tile().locator('img.app-icon');
    assert.equal(await image.getAttribute('src'), iconPath);
    await image.evaluate(image => image.decode());
    assert(await image.evaluate(image => image.complete && image.naturalWidth === 512 && image.naturalHeight === 512));
    assert.equal(await image.evaluate(image => getComputedStyle(image).filter), 'none');
    const rendered = await page.evaluate(() => frappe.desktop_icons.filter(icon => icon.hidden != 1));
    assert.equal(rendered.filter(icon => icon.app === 'crm' && icon.icon_type === 'App').length, 1);
    assert(!rendered.some(icon => icon.icon_type === 'Link' && icon.link_type === 'Workspace Sidebar' && icon.name === 'CRM' && icon.app === 'erpnext'));
    assert.equal(await page.locator('.desktop-icon[data-id="Frappe CRM"]:visible').count(), 0);
  }
  await check('Running Python and built frontend match the expected deployed commit', async () => {
    const response = await page.request.get(base + '/api/method/crm.api.branding.get_runtime_info');
    assert.equal(response.status(), 200);
    const runtime = (await response.json()).message;
    assert.equal(runtime.app, 'crm');
    assert.equal(runtime.version, '1.92.0');
    if (expectedCommit) assert.equal(runtime.commit, expectedCommit);
    const build = await page.request.get(base + '/assets/crm/frontend/legal/source.json');
    assert.equal(build.status(), 200);
    const source = await build.json();
    assert.equal(source.commit, expectedCommit || runtime.commit);
    return { runtime, builtCommit: source.commit };
  });
  await check('Official SVG served unchanged', async () => {
    const response = await page.request.get(base + iconPath);
    assert.equal(response.status(), 200);
    assert(response.headers()['content-type'].includes('image/svg+xml'));
    assert.equal(hash(await response.body()), hash(source));
    return { status: 200, sha256: hash(source) };
  });
  await check('Live Desk tile and native app metadata', async () => {
    const response = await page.goto(base + '/desk', { waitUntil: 'networkidle' });
    assert.equal(response.status(), 200);
    await verifyTile();
    const apps = await (await page.request.get(base + '/api/method/frappe.apps.get_apps')).json();
    const crm = apps.message.find(app => app.name === 'crm');
    assert.equal(apps.message.filter(app => app.name === 'crm').length, 1);
    assert.equal(crm.title, 'ReyBill CRM');
    assert.equal(crm.logo, iconPath);
    assert.equal(crm.route, '/crm');
    await tile().screenshot({ path: path.join(output, 'desk-tile.png') });
    await page.screenshot({ path: path.join(output, 'desk.png') });
    report.crmRecordName = await page.evaluate(() => frappe.desktop_icons.find(icon => icon.app === 'crm' && icon.icon_type === 'App').name);
    return { title: crm.title, name: crm.name, route: crm.route, icon: crm.logo };
  });
  await check('Browser refresh retains the new icon and label', async () => {
    await page.reload({ waitUntil: 'networkidle' });
    await verifyTile();
    const identity = await page.evaluate(() => {
      const icon = frappe.desktop_icons.find(icon => icon.app === 'crm' && icon.icon_type === 'App');
      return { name: icon.name, link: icon.link };
    });
    assert.equal(identity.name, report.crmRecordName);
    assert.equal(identity.link, '/crm');
    return { refreshed: true, internalRecordName: identity.name };
  });
  await check('Cached saved-layout metadata refreshes without changing storage or other apps', async () => {
    const details = await page.evaluate(() => {
      const desktop = frappe.pages.desktop.desktop_page;
      const fields = icons => icons.filter(icon => icon.app !== 'crm').map(({ name, label, logo_url, link, hidden, idx, parent_icon }) => ({ name, label, logo_url, link, hidden, idx, parent_icon }));
      const otherAppsBefore = JSON.stringify(fields(frappe.desktop_icons));
      const storageKey = `${frappe.session.user}:desktop`;
      const storageBefore = localStorage.getItem(storageKey);
      const saved = JSON.parse(JSON.stringify(frappe.boot.desktop_icons));
      const crm = saved.find(icon => icon.app === 'crm' && icon.icon_type === 'App');
      crm.label = 'Frappe CRM'; crm.logo_url = '/assets/crm/images/logo.svg';
      saved.push({ ...crm, name: 'Duplicate CRM', hidden: 0 });
      saved.push({ name: 'CRM', label: 'CRM', app: 'erpnext', icon_type: 'Link', link_type: 'Workspace Sidebar', link_to: 'CRM', hidden: 0 });
      desktop.data = saved;
      desktop.update();
      return { sourceLabel: crm.label, sourceLogo: crm.logo_url, storageUnchanged: storageBefore === localStorage.getItem(storageKey), otherAppsUnchanged: otherAppsBefore === JSON.stringify(fields(frappe.desktop_icons)) };
    });
    await verifyTile();
    assert.equal(details.sourceLabel, 'Frappe CRM');
    assert.equal(details.sourceLogo, '/assets/crm/images/logo.svg');
    assert(details.storageUnchanged && details.otherAppsUnchanged);
    return details;
  });
  await check('Clicking the actual ReyBill CRM tile opens the branded CRM', async () => {
    await page.reload({ waitUntil: 'networkidle' });
    await verifyTile();
    const popup = page.waitForEvent('popup', { timeout: 8000 }).catch(() => null);
    await tile().click();
    const target = await popup || page;
    await target.waitForURL(url => url.pathname.startsWith('/crm'));
    const image = target.locator(`img[src="${iconPath}"]:visible`).first();
    await image.waitFor();
    assert((await target.title()).includes('ReyBill CRM'));
    await image.screenshot({ path: path.join(output, 'crm-opened-from-desk.png') });
    if (target !== page) await target.close();
    return { openedFromNativeTile: true, route: '/crm', branded: true };
  });
  await check('CRM sidebar, favicon and PWA use the official SVG after refresh', async () => {
    await page.goto(base + '/crm', { waitUntil: 'networkidle' });
    const image = page.locator(`img[src="${iconPath}"]:visible`).first();
    await image.waitFor();
    await image.evaluate(image => image.decode());
    assert.equal(await page.locator('link[rel="icon"]').getAttribute('href'), iconPath);
    await image.screenshot({ path: path.join(output, 'crm-icon-light.png') });
    const manifest = await (await page.request.get(base + '/assets/crm/frontend/manifest.webmanifest')).json();
    assert.equal(manifest.icons[0].src, iconPath);
    assert.equal(manifest.icons[0].type, 'image/svg+xml');
    await page.reload({ waitUntil: 'networkidle' });
    await page.locator(`img[src="${iconPath}"]:visible`).first().waitFor();
    assert.equal(await page.locator('link[rel="icon"]').getAttribute('href'), iconPath);
    return { sidebar: iconPath, favicon: iconPath, manifestIcon: manifest.icons[0] };
  });
  await check('CRM icon retains the supplied colors in dark mode', async () => {
    await page.evaluate(() => { localStorage.setItem('theme', 'dark'); document.documentElement.setAttribute('data-theme', 'dark'); });
    await page.reload({ waitUntil: 'networkidle' });
    assert.equal(await page.locator('html').getAttribute('data-theme'), 'dark');
    const image = page.locator(`img[src="${iconPath}"]:visible`).first();
    await image.waitFor(); await image.evaluate(image => image.decode());
    assert.equal(await image.evaluate(image => getComputedStyle(image).filter), 'none');
    await image.screenshot({ path: path.join(output, 'crm-icon-dark.png') });
    return { theme: 'dark', noRecoloring: true };
  });
  await browser.close();
  report.pageErrors = [...new Set(report.pageErrors)];
  report.passed = report.checks.every(check => check.passed) && report.pageErrors.length === 0;
  fs.writeFileSync(path.join(output, 'results.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
  if (!report.passed) process.exitCode = 1;
})().catch(error => { console.error(error.message); process.exitCode = 1; });
