/* Authenticated normal-site About/legal verification. No business writes.
 * Session files, browser reports and cropped screenshots must stay outside Git. */
const { chromium } = require("playwright");
const fs = require("node:fs");
const path = require("node:path");
const assert = require("node:assert/strict");
const branding = require("../crm/branding.json");
const base = process.env.REYBILL_BASE_URL || "http://reybill.localhost:8000";
const output =
  process.env.REYBILL_QA_OUTPUT || "/tmp/reybill-about-verification";
assert.equal(new URL(base).hostname, "reybill.localhost");
assert.notEqual(new URL(base).port, "8012");
assert(
  process.env.REYBILL_SESSION_FILE,
  "Provide a protected native test session file"
);
fs.mkdirSync(output, { recursive: true });
const report = { base, checks: [], pageErrors: [] };

async function main() {
  const browser = await chromium.launch({
    headless: true,
    args: ["--no-sandbox"],
  });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
  });
  await context.addCookies([
    {
      name: "sid",
      value: fs.readFileSync(process.env.REYBILL_SESSION_FILE, "utf8").trim(),
      url: base,
      httpOnly: true,
    },
  ]);
  await context.route("**/*", (route) =>
    new URL(route.request().url()).origin === base
      ? route.continue()
      : route.abort()
  );
  const page = await context.newPage();
  page.on("pageerror", (error) => report.pageErrors.push(String(error)));
  const save = () =>
    fs.writeFileSync(
      path.join(output, "results.json"),
      JSON.stringify(report, null, 2)
    );
  async function check(name, run) {
    try {
      report.checks.push({ name, passed: true, details: await run() });
    } catch (error) {
      report.checks.push({ name, passed: false, error: error.message });
    }
    await page.keyboard.press("Escape");
    await page.keyboard.press("Escape");
    save();
  }
  async function menuItem(name) {
    const opener = page
      .getByRole("button")
      .filter({ hasText: branding.productName })
      .first();
    // Native mobile navigation closes its drawer after selecting a menu action.
    if (page.viewportSize().width < 768 && !(await opener.isVisible())) {
      await page
        .locator("button")
        .filter({ has: page.locator("svg") })
        .first()
        .click();
    }
    await opener.click();
    await page.getByRole("menuitem", { name, exact: true }).click();
    const dialog = page.getByRole("dialog").last();
    await dialog.waitFor();
    return dialog;
  }
  async function aboutScreenshot(name) {
    const dialog = await menuItem("About");
    assert.equal(
      await dialog.getByRole("heading").innerText(),
      branding.productName
    );
    assert.equal(
      await dialog.locator("[data-crm-version]").innerText(),
      "Version " + (await page.evaluate(() => window.crm_version))
    );
    const text = await dialog.innerText();
    assert(text.includes(branding.companyName));
    assert(
      !/GitHub|Source Code|Report an Issue|Open Source|Frappe|AGPL|warranty/.test(
        text
      )
    );
    assert.equal(await dialog.locator("details").count(), 0);
    const links = await dialog.locator("a").evaluateAll((nodes) =>
      nodes.map((a) => ({
        label: a.textContent.trim(),
        href: a.getAttribute("href"),
        target: a.target,
        rel: a.rel,
      }))
    );
    assert.deepEqual(
      links.map((a) => [a.label, a.href]),
      [
        ["Website", branding.website],
        ["Documentation", branding.documentation],
        ["Contact Support", branding.support],
      ]
    );
    assert(
      links.every((a) => a.target === "_blank" && a.rel.includes("noopener"))
    );
    assert.equal(
      await dialog.getByRole("navigation", { name: "Social media" }).count(),
      0
    );
    const icon = dialog.locator("img");
    assert.equal(await icon.getAttribute("src"), branding.appIcon);
    assert(await icon.evaluate((el) => el.complete && el.naturalWidth > 0));
    const box = await dialog.boundingBox();
    assert(box.width <= (await page.evaluate(() => innerWidth - 24)));
    assert(await dialog.evaluate((el) => el.scrollWidth <= el.clientWidth));
    await dialog.screenshot({ path: path.join(output, name + ".png") });
    return { links, width: box.width, icon: branding.appIcon };
  }
  await check("Normal test runtime identity", async () => {
    await page.goto(base + "/crm/dashboard", { waitUntil: "networkidle" });
    const help = page.locator("aside").filter({
      has: page.getByRole("button", { name: "Close", exact: true }),
    });
    if (await help.count())
      await help.getByRole("button", { name: "Close", exact: true }).click();
    const response = await page.request.get(
      base + "/api/method/crm.api.branding.get_runtime_info"
    );
    assert.equal(response.status(), 200);
    const runtime = (await response.json()).message;
    assert.equal(runtime.version, "1.92.0");
    assert(runtime.source_path.includes("/apps/reybill_crm/"));
    report.runtime = runtime;
    return runtime;
  });
  await check(
    "About light: minimal identity, exact links and unchanged artwork",
    async () => {
      await page.evaluate(() =>
        document.documentElement.setAttribute("data-theme", "light")
      );
      return aboutScreenshot("about-light");
    }
  );
  await check(
    "Ordinary browser refresh retains the current About build",
    async () => {
      await page.reload({ waitUntil: "networkidle" });
      return aboutScreenshot("about-after-refresh");
    }
  );
  await check(
    "Keyboard focus stays inside About and Escape closes it",
    async () => {
      const dialog = await menuItem("About");
      await dialog.getByRole("button", { name: "Close", exact: true }).focus();
      const labels = [];
      for (let i = 0; i < 4; i++) {
        await page.keyboard.press("Tab");
        assert(
          await dialog.evaluate((el) => el.contains(document.activeElement))
        );
        labels.push(
          await page.evaluate(
            () =>
              document.activeElement.textContent.trim() ||
              document.activeElement.getAttribute("aria-label")
          )
        );
        assert(
          await page.evaluate(
            () =>
              getComputedStyle(document.activeElement).outlineStyle !== "none"
          )
        );
      }
      assert.deepEqual(labels, [
        "Website",
        "Documentation",
        "Contact Support",
        "Close",
      ]);
      await page.keyboard.press("Escape");
      await dialog.waitFor({ state: "hidden" });
      return { tabCycle: labels, escape: true };
    }
  );
  await check("About dark uses native surfaces and readable text", async () => {
    await page.evaluate(() =>
      document.documentElement.setAttribute("data-theme", "dark")
    );
    const result = await aboutScreenshot("about-dark");
    result.colors = await page
      .getByRole("dialog")
      .last()
      .evaluate((el) => ({
        surface: getComputedStyle(el).backgroundColor,
        text: getComputedStyle(el.querySelector("h3")).color,
      }));
    assert.notEqual(result.colors.surface, "rgb(255, 255, 255)");
    return result;
  });
  await check(
    "Legal Notices user menu: attribution, warranty, exact source and license downloads",
    async () => {
      const dialog = await menuItem("Legal Notices");
      const text = await dialog.innerText();
      for (const term of [
        "Frappe Technologies Pvt. Ltd.",
        "AGPLv3",
        "no warranty",
        "copy, modify and redistribute",
        "at no charge",
      ])
        assert(text.includes(term));
      const source = await (
        await page.request.get(base + "/assets/crm/frontend/legal/source.json")
      ).json();
      assert.equal(source.commit, report.runtime.commit);
      assert.equal(
        await dialog
          .getByRole("link", { name: "View Corresponding Source", exact: true })
          .getAttribute("href"),
        source.sourceUrl
      );
      assert.equal(
        await dialog
          .getByRole("link", { name: "Download Source Archive", exact: true })
          .getAttribute("href"),
        source.archiveUrl
      );
      for (const filename of ["AGPL-3.0.txt", "THIRD_PARTY_NOTICES.txt"]) {
        const response = await page.request.get(
          base + "/assets/crm/frontend/legal/" + filename
        );
        assert.equal(response.status(), 200);
        const body = await response.text();
        if (filename.startsWith("AGPL"))
          assert.equal(
            body,
            fs.readFileSync(path.join(__dirname, "../LICENSE"), "utf8")
          );
        else
          for (const notice of [
            "Frappe Framework UI",
            "Frappe UI compatibility shim",
            "@headlessui/vue",
            "leaflet-draw",
            "DOMPurify",
            "workbox-core",
            "lucide-static",
          ])
            assert(body.includes(notice), notice);
      }
      await dialog.screenshot({ path: path.join(output, "legal-notices.png") });
      return { source, licensesServed: true };
    }
  );
  await check(
    "Settings also exposes Legal Notices without saving settings",
    async () => {
      const dialog = await menuItem("Settings");
      await dialog.locator('[data-page="Legal Notices"]').click();
      await dialog.locator("[data-legal-notices]").waitFor();
      assert((await dialog.innerText()).includes("Corresponding Source"));
      return { location: "Settings → Legal Notices" };
    }
  );
  await check("CRM list navigation remains functional", async () => {
    for (const route of ["leads", "deals", "contacts", "organizations"]) {
      const response = await page.goto(base + "/crm/" + route + "/view/list", {
        waitUntil: "networkidle",
      });
      assert.equal(response.status(), 200);
      assert((await page.title()).includes(branding.productName));
    }
    return { pages: 4, recordsWritten: false };
  });
  await check(
    "Mobile About and direct legal access fit the viewport",
    async () => {
      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto(base + "/crm/leads/view/list", {
        waitUntil: "networkidle",
      });
      await page
        .locator("button")
        .filter({ has: page.locator("svg") })
        .first()
        .click();
      await page.evaluate(() =>
        document.documentElement.setAttribute("data-theme", "light")
      );
      const result = await aboutScreenshot("about-mobile");
      await page.keyboard.press("Escape");
      await page.locator("[data-about-dialog]").waitFor({ state: "hidden" });
      const legal = await menuItem("Legal Notices");
      assert(await legal.locator("[data-legal-notices]").isVisible());
      assert(await legal.evaluate((el) => el.scrollWidth <= el.clientWidth));
      await legal.getByRole("button", { name: "Close", exact: true }).click();
      await legal.waitFor({ state: "hidden" });
      return { ...result, mobileLegalAccess: true, mobileEscapeAndClose: true };
    }
  );
  await browser.close();
  report.passed =
    report.checks.every((check) => check.passed) && !report.pageErrors.length;
  save();
  console.log(
    JSON.stringify(
      {
        passed: report.passed,
        checks: report.checks.map(({ name, passed, error }) => ({
          name,
          passed,
          error,
        })),
        pageErrors: report.pageErrors,
      },
      null,
      2
    )
  );
  if (!report.passed) process.exitCode = 1;
}
main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
