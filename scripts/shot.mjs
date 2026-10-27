/**
 * Детерминированный скриншот без MCP: открывает страницу, ждёт элемент, снимает его.
 * Примеры:
 *   node scripts/shot.mjs http://localhost:3000/ru/products ".ir-demo" .tmp/demo.png
 *   node scripts/shot.mjs http://localhost:3000/ru/products ".product-card" .tmp/card.png 390x844
 *   node scripts/shot.mjs http://localhost:3000/ru/products "" .tmp/full.png 390x844
 */
import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";
import { dirname } from "node:path";

const [url, selector, out, viewport = "390x844", action = ""] = process.argv.slice(2);
if (!url || !out) {
  console.error("usage: node scripts/shot.mjs <url> <selector|''> <out.png> [WxH] [action]");
  process.exit(1);
}
const [w, h] = viewport.split("x").map(Number);

await mkdir(dirname(out), { recursive: true }).catch(() => {});
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: w || 390, height: h || 844 } });
  await page.goto(url, { waitUntil: "networkidle", timeout: 60000 });
  if (selector) {
    await page.waitForSelector(selector, { timeout: 30000 });
  }
  if (action) {
    await page.evaluate((a) => {
      if (a.includes("hide-plates")) document.querySelectorAll(".ir-demo__plate").forEach((p) => (p.style.visibility = "hidden"));
      if (a.includes("magenta-bg")) document.body.style.backgroundColor = "#ff00ff";
      if (a.includes("close-filter")) {
        document.querySelectorAll("dialog[open]").forEach((d) => { try { d.close(); } catch {} });
        document.querySelectorAll(".show-shop-filter__dialog[open]").forEach((d) => { try { d.close(); } catch {} });
      }
    }, action);
  }
  if (selector) {
    const loc = selector.includes("#last") ? page.locator(selector.replace("#last","")).last() : page.locator(selector).first();
    await loc.screenshot({ path: out });
  } else {
    await page.screenshot({ path: out, fullPage: true });
  }
  console.log("ok", out);
} finally {
  await browser.close();
}
