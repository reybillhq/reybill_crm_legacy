/* Read-only rendered CRM audit. Keep session files, reports and screenshots outside Git. */
const { chromium } = require("playwright");
const fs = require("node:fs");
const path = require("node:path");
const assert = require("node:assert/strict");
const branding = require("../crm/branding.json");
const base = process.env.REYBILL_BASE_URL || "http://reybill.localhost:8000";
const out =
  process.env.REYBILL_QA_OUTPUT || "/tmp/reybill-customer-branding-audit";
assert.equal(new URL(base).hostname, "reybill.localhost");
assert.notEqual(new URL(base).port, "8012");
fs.mkdirSync(out, { recursive: true });
const report = { base, screens: [], checks: [], pageErrors: [] };
const forbidden = /Frapp[eé]|ERP\s?Next|ReyBill Sales/i;
async function main() {
  const browser = await chromium.launch({
    headless: true,
    args: ["--no-sandbox"],
  });
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
  });
  await ctx.addCookies([
    {
      name: "sid",
      value: fs.readFileSync(process.env.REYBILL_SESSION_FILE, "utf8").trim(),
      url: base,
      httpOnly: true,
    },
  ]);
  await ctx.route("**/*", (route) =>
    new URL(route.request().url()).origin === base
      ? route.continue()
      : route.abort()
  );
  const page = await ctx.newPage();
  page.on("pageerror", (e) => report.pageErrors.push(String(e)));
  const save = () =>
    fs.writeFileSync(
      path.join(out, "rendered-audit.json"),
      JSON.stringify(report, null, 2)
    );
  async function settle() {
    await page.waitForTimeout(250);
    await page.waitForLoadState("networkidle");
  }
  async function scan(name, scope = page.locator("body")) {
    const text = await scope.innerText();
    const attributes = await scope
      .locator(
        "[placeholder]:visible, [data-placeholder]:visible, [aria-label]:visible, [title]:visible"
      )
      .evaluateAll((nodes) =>
        nodes.flatMap((n) =>
          ["placeholder", "data-placeholder", "aria-label", "title"].map(
            (a) => n.getAttribute(a) || ""
          )
        )
      );
    const matches = [text, ...attributes].flatMap((t) =>
      [...t.matchAll(/Frapp[eé]|ERP\s?Next|ReyBill Sales/gi)].map((m) => m[0])
    );
    const promoLinks = await scope
      .locator("a[href]:visible")
      .evaluateAll((nodes) =>
        nodes
          .map((a) => a.href)
          .filter((h) =>
            /https?:\/\/([^/]*\.)?(frappe\.io|frappecloud\.com|erpnext\.com)\//i.test(
              h
            )
          )
      );
    report.screens.push({
      name,
      matches: [...new Set(matches)],
      upstreamPromotionalLinks: promoLinks.length,
    });
    save();
    assert(!matches.length, `${name}: ${matches.join(", ")}`);
    assert(!promoLinks.length, name + ": upstream promotional links");
  }
  async function check(name, fn) {
    try {
      await fn();
      report.checks.push({ name, passed: true });
    } catch (e) {
      report.checks.push({ name, passed: false, error: e.message });
    }
    save();
  }
  async function menu(name) {
    await page
      .getByRole("button")
      .filter({ hasText: branding.productName })
      .first()
      .click();
    await page.getByRole("menuitem", { name, exact: true }).click();
  }
  await page.goto(base + "/crm/dashboard", { waitUntil: "networkidle" });
  await check("Dashboard, navigation and onboarding", async () => {
    await scan("Dashboard and initial onboarding");
    const help = page
      .locator("aside")
      .filter({
        has: page.getByRole("button", { name: "Close", exact: true }),
      });
    if (await help.count())
      await help.getByRole("button", { name: "Close", exact: true }).click();
    const helpButton = page
      .getByRole("button", { name: /^(Continue|Start now|Help)$/ })
      .first();
    if (await helpButton.isVisible()) {
      await helpButton.click();
      await settle();
      await scan("Onboarding panel");
      await page
        .getByRole("button", { name: "Close", exact: true })
        .last()
        .click();
    }
  });
  await check("Switcher, About and simplified legal page", async () => {
    await page
      .getByRole("button")
      .filter({ hasText: branding.productName })
      .first()
      .click();
    await page.getByRole("menuitem", { name: "Apps", exact: true }).hover();
    await settle();
    await scan("App switcher");
    await page.keyboard.press("Escape");
    await page.keyboard.press("Escape");
    for (const name of ["About", "Legal Notices"]) {
      await menu(name);
      const marker =
        name === "About" ? "[data-about-dialog]" : "[data-legal-notices]";
      const dialog = page
        .getByRole("dialog")
        .filter({ has: page.locator(marker) })
        .last();
      await dialog.waitFor();
      await scan(name, dialog);
      await dialog.screenshot({
        path: path.join(
          out,
          name === "About" ? "about.png" : "legal-notices.png"
        ),
      });
      await page.keyboard.press("Escape");
      await dialog.waitFor({ state: "hidden" });
    }
  });
  for (const route of [
    "leads",
    "deals",
    "contacts",
    "organizations",
    "notes",
    "tasks",
    "call-logs",
    "data-import",
  ]) {
    await check("Navigation and draft: " + route, async () => {
      await page.goto(base + "/crm/" + route + "/view/list", {
        waitUntil: "networkidle",
      });
      await scan(route + " list");
      const create = page
        .getByRole("button", { name: "Create", exact: true })
        .first();
      if (
        ["leads", "deals", "contacts", "organizations"].includes(route) &&
        (await create.isVisible())
      ) {
        await create.click();
        const dialog = page.getByRole("dialog").last();
        await dialog.waitFor();
        await settle();
        await scan(route + " create draft", dialog);
        await page.keyboard.press("Escape");
      }
    });
  }
  await check("Deal pipeline and notifications", async () => {
    await page.goto(base + "/crm/deals/view/kanban", {
      waitUntil: "networkidle",
    });
    await scan("Deal pipeline");
    await page.goto(base + "/crm/notifications", { waitUntil: "networkidle" });
    await scan("Notifications");
  });
  await page.goto(base + "/crm/dashboard", { waitUntil: "networkidle" });
  await menu("Settings");
  const settings = page
    .getByRole("dialog")
    .filter({ has: page.locator('[data-page="Legal Notices"]') })
    .last();
  await settings.waitFor();
  const tabs = await settings
    .locator("[data-page]")
    .evaluateAll((nodes) => nodes.map((n) => n.getAttribute("data-page")));
  for (const tab of tabs)
    await check("Settings: " + tab, async () => {
      await settings
        .locator("[data-page]")
        .filter({ hasText: tab })
        .first()
        .click();
      await settle();
      await scan("Settings → " + tab, settings);
      if (tab === "ReyBill ERP") {
        const r = await page.request.get(
          base +
            "/api/method/frappe.client.get?doctype=ERPNext%20CRM%20Settings"
        );
        assert.equal(r.status(), 200);
        const doc = (await r.json()).message;
        assert.equal(doc.enabled, 1);
        assert.equal(doc.sync_products, 1);
        await settings.screenshot({
          path: path.join(out, "reybill-erp.png"),
          mask: [settings.getByText(doc.erpnext_company, { exact: true })],
        });
        const permission = await page.request.get(
          base +
            "/api/method/crm.fcrm.doctype.erpnext_crm_settings.erpnext_crm_settings.can_view_quotations"
        );
        assert.equal(permission.status(), 200);
        const sync = await page.request.get(
          base +
            "/api/method/crm.fcrm.doctype.erpnext_crm_settings.erpnext_crm_settings.get_product_sync_status"
        );
        assert.equal(sync.status(), 200);
      }
      if (tab === "Templates") {
        await settings
          .getByRole("button", { name: "New", exact: true })
          .click();
        await settle();
        await scan("New email template examples", settings);
        assert(
          (
            await settings
              .locator("input[placeholder]")
              .evaluateAll((nodes) => nodes.map((n) => n.placeholder))
          ).some((p) => p.includes(branding.companyName))
        );
        await settings.screenshot({
          path: path.join(out, "email-template-example.png"),
        });
      }
      if (tab === "Workflow Automations") {
        await settings
          .getByRole("button", { name: "New", exact: true })
          .click();
        const builder = page
          .getByRole("dialog")
          .filter({
            has: page.getByRole("textbox", {
              name: "Automation title",
              exact: true,
            }),
          })
          .last();
        await builder.waitFor();
        await settle();
        await scan("Workflow automation draft", builder);
        await builder
          .getByRole("button", { name: "Close", exact: true })
          .click();
        await builder.waitFor({ state: "hidden" });
      }
    });
  await page.keyboard.press("Escape");
  await check("Command palette settings search", async () => {
    await page.getByRole("button", { name: "Search", exact: true }).click();
    await page
      .getByPlaceholder("Search records or type a command...")
      .fill("Settings");
    await settle();
    await scan("Command palette");
    await page.keyboard.press("Escape");
  });
  for (const lang of ["de", "ar", "nl"])
    await check("Translated navigation and legal: " + lang, async () => {
      await page.goto(base + "/crm?_lang=" + lang, {
        waitUntil: "networkidle",
      });
      await scan(lang + " navigation");
      const aboutLabel = await page.evaluate(() => window.__("Legal Notices"));
      await menu(aboutLabel);
      const legal = page
        .getByRole("dialog")
        .filter({ has: page.locator("[data-legal-notices]") })
        .last();
      await legal.waitFor();
      await scan(lang + " Legal Notices", legal);
      await page.keyboard.press("Escape");
    });
  await browser.close();
  report.passed =
    report.checks.every((c) => c.passed) && !report.pageErrors.length;
  save();
  console.log(
    JSON.stringify(
      {
        passed: report.passed,
        screens: report.screens.length,
        failures: report.checks.filter((c) => !c.passed),
        pageErrors: report.pageErrors,
      },
      null,
      2
    )
  );
  if (!report.passed) process.exitCode = 1;
}
main().catch((e) => {
  console.error(e.message);
  process.exitCode = 1;
});
