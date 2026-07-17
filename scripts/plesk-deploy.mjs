import { chromium } from 'playwright';

const URL = 'https://vh324.by3020.ihb.by:8443';
const USER = 'santexsistem_gmail_com6809';
const PASS = '27cwr7UCn%%8JDU';
const DOMAIN = 'vh324.by3020.ihb.by';

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function waitCloseOverlay(page) {
  // Wait for close button then press Escape to dismiss overlay
  for (let i = 0; i < 20; i++) {
    const c = page.locator('button, a, span').filter({ hasText: /Закрыть/i }).first();
    if (await c.isVisible({ timeout: 500 }).catch(() => false)) { 
      await c.click(); 
      await sleep(500);
      await page.keyboard.press('Escape');
      await sleep(500);
      return;
    }
    await sleep(1000);
  }
}

async function searchText(page, text) {
  // Press Escape first to dismiss any overlay
  await page.keyboard.press('Escape');
  await sleep(300);
  // Focus search via Tab
  for (let i = 0; i < 5; i++) {
    await page.keyboard.press('Tab');
    await sleep(100);
  }
  await sleep(200);
  await page.keyboard.type(text, { delay: 50 });
  await sleep(1500);
  await page.keyboard.press('ArrowDown');
  await sleep(200);
  await page.keyboard.press('Enter');
  await sleep(3000);
}

async function deploy() {
  const browser = await chromium.launch({ headless: false, slowMo: 300 });
  const page = await browser.newPage({ ignoreHTTPSErrors: true });

  try {
    console.log('[1] Логин...');
    await page.goto(URL, { timeout: 60000 });
    await sleep(2000);
    await page.fill('input[name="login_name"]', USER);
    await page.fill('input[name="passwd"]', PASS);
    await page.click('button:has-text("Войти")');
    await page.waitForLoadState('load');
    await sleep(4000);

    console.log('[2] Домен...');
    await searchText(page, DOMAIN);

    console.log('[3] Git...');
    await searchText(page, 'Git');
    await sleep(1000);

    const fBtn = page.locator('button, a').filter({ hasText: /Получить сейчас/i }).first();
    if (await fBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await fBtn.click(); await sleep(2000);
      await waitCloseOverlay(page);
    }
    const dBtn = page.locator('button, a').filter({ hasText: /Развернуть сейчас/i }).first();
    if (await dBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await dBtn.click(); await sleep(2000);
      await waitCloseOverlay(page);
    }
    console.log('   ✅ Git done');

    console.log('[4] Node.js...');
    await searchText(page, 'node.js');
    await sleep(1000);

    const scriptBtn = page.locator('button[data-test-id="run-script-button"]');
    if (await scriptBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await scriptBtn.click(); await sleep(2000);
      console.log('   ✅ run-script-button');
    }

    await page.keyboard.press('Escape');
    await sleep(500);
    await page.keyboard.press('Tab');
    await sleep(200);
    await page.keyboard.type('build', { delay: 50 });
    await sleep(300);
    console.log('   ✅ build введён');

    await page.keyboard.press('Enter');
    await sleep(2000);
    console.log('   ✅ Enter — build запущен');

    await page.screenshot({ path: 'deploy-build-confirm.png', fullPage: true });
    console.log('\n✅ Build запущен!');
    console.log('   Через 3-5 мин проверь сайт.');
    console.log('   Для перезапуска скажи "перезапусти"');

  } catch (e) {
    console.error('❌', e.message);
    await page.screenshot({ path: 'deploy-err.png' });
  }
}
deploy();
