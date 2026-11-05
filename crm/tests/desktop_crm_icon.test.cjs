const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
const source = fs.readFileSync(path.join(__dirname, '../public/js/desktop_crm_icon.js'), 'utf8');

function fixture() {
  const crm = { name: 'Frappe CRM', app: 'crm', icon_type: 'App', label: 'Frappe CRM', logo_url: '/old.svg', link: '/crm', idx: 9, hidden: 1, parent_icon: 'Sales', custom: 'preserve' };
  const erp = { name: 'ERPNext', app: 'erpnext', icon_type: 'App', label: 'ReyBill ERP', logo_url: '/erp.svg' };
  const workspace = { app: 'crm', icon_type: 'Link', label: 'Workspace', link: '/desk/workspace' };
  const icons = [crm, erp, workspace];
  const calls = [];
  const desktop = { edit_mode: false, prepare(...args) { calls.push(args); return 'native'; } };
  const frappe = { boot: { crm_app_icon: { name: 'ReyBill CRM', src: '/assets/crm/images/reybill-crm.svg' } }, desktop_icons: icons, new_desktop_icons: icons, pages: { desktop: { desktop_page: desktop, on_page_load() {} } } };
  const context = { frappe };
  vm.runInNewContext(source, context);
  return { frappe, desktop, icons, context, calls };
}

test('updates only CRM App presentation and leaves saved source objects intact', () => {
  const { frappe, desktop, icons } = fixture();
  const original = JSON.stringify(icons);
  assert.equal(desktop.prepare('argument'), 'native');
  assert.equal(JSON.stringify(icons), original);
  assert.equal(frappe.desktop_icons[0].label, 'ReyBill CRM');
  assert.equal(frappe.desktop_icons[0].logo_url, '/assets/crm/images/reybill-crm.svg');
  for (const key of ['name', 'link', 'idx', 'hidden', 'parent_icon', 'custom']) assert.equal(frappe.desktop_icons[0][key], icons[0][key]);
  assert.equal(frappe.desktop_icons[1], icons[1]);
  assert.equal(frappe.desktop_icons[2], icons[2]);
});

test('edit mode preserves native removal state and uses the edit array only', () => {
  const { frappe, desktop, icons } = fixture();
  desktop.edit_mode = true;
  desktop.prepare();
  assert.equal(frappe.desktop_icons, icons);
  assert.equal(frappe.new_desktop_icons[0].hidden, 1);
  assert.equal(frappe.new_desktop_icons[0].idx, 9);
});

test('repeated installation does not stack wrappers', () => {
  const { desktop, context, calls } = fixture();
  const first = desktop.prepare;
  vm.runInNewContext(source, context);
  assert.equal(desktop.prepare, first);
  desktop.prepare('once');
  assert.equal(calls.length, 1);
});

test('installs after native page creation and preserves its return value', () => {
  const desktop = { prepare() {} };
  const page = { on_page_load() { this.desktop_page = desktop; return 'loaded'; } };
  vm.runInNewContext(source, { frappe: { pages: { desktop: page } } });
  assert.equal(page.on_page_load(), 'loaded');
  assert.equal(desktop.prepare.crm_app_icon, true);
});
