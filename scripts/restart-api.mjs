import { chromium } from 'playwright';

const PLESK_URL = 'https://vh324.by3020.ihb.by:8443';
const USER = 'santexsistem_gmail_com6809';
const PASS = '27cwr7UCn%%8JDU';
const DOMAIN = 'api.vh324.by3020.ihb.by';

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

(async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 300 });
  const context = await browser.newContext({ ignoreHTTPSErrors: true });
  const page = await context.newPage();

  try {
    console.log('[1] Login...');
    for (let i = 0; i < 5; i++) {
      try {
        await page.goto(PLESK_URL, { timeout: 30000 });
        break;
      } catch {
        if (i < 4) await sleep(15000);
        else throw new Error('Plesk недоступен');
      }
    }
    await page.fill('input[name="login_name"]', USER);
    await page.fill('input[name="passwd"]', PASS);
    await page.click('button:has-text("Войти")');
    await page.waitForLoadState('domcontentloaded');
    await sleep(4000);

    console.log('[2] Domain:', DOMAIN);
    await page.keyboard.press('Escape');
    await page.locator('#searchTerm').click();
    await sleep(500);
    await page.keyboard.press('Control+a');
    await page.keyboard.press('Delete');
    await page.keyboard.type(DOMAIN, { delay: 50 });
    await sleep(2500);

    let found = false;
    for (const item of await page.locator('[role="option"]').all()) {
      if ((await item.textContent())?.trim() === DOMAIN) {
        await item.click();
        found = true;
        break;
      }
    }
    if (!found) { await page.keyboard.press('ArrowDown'); await page.keyboard.press('Enter'); }
    await sleep(3000);
    console.log('   ✅', page.url());
    if (!page.url().includes('/id/')) throw new Error('Wrong domain: ' + page.url());

    console.log('[3] Node.js...');
    await page.keyboard.press('Escape');
    await page.locator('#searchTerm').click();
    await sleep(300);
    await page.keyboard.press('Control+a');
    await page.keyboard.press('Delete');
    await page.keyboard.type('node.js', { delay: 50 });
    await sleep(2500);
    for (const item of await page.locator('[role="option"]').all()) {
      if ((await item.textContent())?.trim() === 'Node.js') { await item.click(); break; }
    }
    await sleep(3000);
    console.log('   ✅ Node.js page');

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
      throw new Error('restart-domain-button not found');
    }

    console.log('\n✅ API приложение перезапущено!');
  } catch (e) {
    console.error('❌', e.message);
    await page.screenshot({ path: 'restart-api-err.png' }).catch(() => {});
  } finally {
    await browser.close();
  }
})();
