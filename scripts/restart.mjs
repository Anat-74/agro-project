import { chromium } from 'playwright';

const PLESK_URL = 'https://vh324.by3020.ihb.by:8443';
const USER = 'santexsistem_gmail_com6809';
const PASS = '27cwr7UCn%%8JDU';
const DOMAIN = 'vh324.by3020.ihb.by';

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

(async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 300 });
  const context = await browser.newContext({ ignoreHTTPSErrors: true });
  const page = await context.newPage();

  try {
    // Шаг 2: Логин
    console.log('[1] Логин...');
    await page.goto(PLESK_URL, { timeout: 30000, waitUntil: 'domcontentloaded' });
    await page.fill('input[name="login_name"]', USER);
    await page.fill('input[name="passwd"]', PASS);
    await page.locator('button:has-text("Войти")').click();
    await page.waitForLoadState('domcontentloaded');
    await sleep(4000);

    // Шаг 3: Выбор домена
    console.log('[2] Домен...');
    await page.keyboard.press('Escape');
    await sleep(300);
    await page.locator('#searchTerm').click();
    await sleep(200);
    await page.keyboard.press('Control+a');
    await sleep(100);
    await page.keyboard.press('Delete');
    await sleep(200);
    await page.keyboard.type(DOMAIN, { delay: 50 });
    await sleep(2500);

    for (const item of await page.locator('[role="option"]').all()) {
      const t = (await item.textContent())?.trim();
      if (t === DOMAIN) { await item.click(); break; }
    }
    await sleep(3000);

    const url1 = page.url();
    if (!url1.includes('/id/589/')) throw new Error(`Wrong domain: ${url1}`);
    console.log(`   ✅ ${url1}`);

    // Шаг 5 (restart): Node.js → Перезапустить приложение
    console.log('[3] Перезапуск...');
    await page.keyboard.press('Escape');
    await sleep(300);
    await page.locator('#searchTerm').click();
    await sleep(200);
    await page.keyboard.press('Control+a');
    await sleep(100);
    await page.keyboard.press('Delete');
    await sleep(200);
    await page.keyboard.type('node.js', { delay: 50 });
    await sleep(2500);

    for (const item of await page.locator('[role="option"]').all()) {
      const t = (await item.textContent())?.trim();
      if (t === 'Node.js') { await item.click(); break; }
    }
    await sleep(3000);

    const nodeTitle = await page.locator('.page-content-header__title').textContent();
    if (!nodeTitle.includes('Node.js на')) throw new Error('Not on Node.js page');

    const restartBtn = page.getByRole('button', { name: 'Перезапустить приложение' });
    if (await restartBtn.isVisible({ timeout: 15000 }).catch(() => false)) {
      await restartBtn.scrollIntoViewIfNeeded();
      await sleep(500);
      await restartBtn.click();
      console.log('   ✅ Перезапуск приложения');
    } else {
      throw new Error('Кнопка перезапуска не найдена');
    }

    console.log('\n✅ Приложение перезапускается. Жди 20-30 сек.');
    await page.screenshot({ path: 'restart-ok.png' });

  } catch (e) {
    console.error('❌', e.message);
    await page.screenshot({ path: 'restart-err.png' }).catch(() => {});
  }
})();
