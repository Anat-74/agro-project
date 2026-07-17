import { chromium } from 'playwright';

const PLESK_URL = 'https://vh324.by3020.ihb.by:8443';
const USER = 'santexsistem_gmail_com6809';
const PASS = '27cwr7UCn%%8JDU';
const DOMAIN = 'vh324.by3020.ihb.by';

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

(async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 300 });
  const context = await browser.newContext({ ignoreHTTPSErrors: true });
  const page = await context.newPage();

  try {
    // 1. LOGIN
    console.log('[1] Login...');
    for (let i = 0; i < 5; i++) {
      try {
        await page.goto(PLESK_URL, { timeout: 30000 });
        break;
      } catch {
        if (i < 4) await sleep(15000);
        else throw new Error('PLESK недоступен после 5 попыток');
      }
    }
    await page.fill('input[name="login_name"]', USER);
    await page.fill('input[name="passwd"]', PASS);
    await page.click('button:has-text("Войти")');
    await page.waitForLoadState('domcontentloaded');
    await sleep(4000);

    // 2. DOMAIN
    console.log('[2] Domain...');
    await page.keyboard.press('Escape');
    await page.locator('#searchTerm').click();
    await page.keyboard.press('Control+a');
    await page.keyboard.press('Delete');
    await page.keyboard.type(DOMAIN, { delay: 50 });
    await sleep(2500);

    let domainFound = false;
    for (const item of await page.locator('[role="option"]').all()) {
      if ((await item.textContent())?.trim() === DOMAIN) {
        await item.click();
        domainFound = true;
        break;
      }
    }
    if (!domainFound) {
      await page.keyboard.press('ArrowDown');
      await page.keyboard.press('Enter');
    }
    await sleep(3000);

    if (!page.url().includes('/id/589/')) {
      throw new Error('Wrong domain: ' + page.url());
    }
    console.log('   ✅', page.url());

    // 3. SEARCH NODE.JS
    console.log('[3] Searching Node.js...');
    await page.keyboard.press('Escape');
    await page.locator('#searchTerm').click();
    await page.keyboard.press('Control+a');
    await page.keyboard.press('Delete');
    await page.keyboard.type('node.js', { delay: 50 });
    await sleep(2500);

    for (const item of await page.locator('[role="option"]').all()) {
      if ((await item.textContent())?.trim() === 'Node.js') {
        await item.click();
        break;
      }
    }
    await sleep(3000);

    const title = await page.locator('.page-content-header__title').textContent().catch(() => '');
    if (!title.includes('Node.js')) throw new Error('Not on Node.js page');

    // 4. RESTART
    console.log('[4] Restart...');
    const restartBtn = page.locator('button[data-test-id="restart-domain-button"]');
    if (await restartBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await restartBtn.click();
      await sleep(1500);
      const confirmBtn = page.locator('button:has-text("Да")');
      if (await confirmBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await confirmBtn.click();
      }
      console.log('   ✅ Restart confirmed, waiting 20s...');
      await sleep(20000);
    } else {
      // fallback: maybe it's on the same page as run-script
      console.log('   ⚠️ restart button not visible, checking page...');
      throw new Error('restart-domain-button not found');
    }

    console.log('\n✅ Приложение перезапущено!');
  } catch (e) {
    console.error('❌', e.message);
    await page.screenshot({ path: 'restart-err.png' }).catch(() => {});
  } finally {
    await browser.close();
  }
})();
