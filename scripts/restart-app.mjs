import { chromium } from 'playwright';

const PLESK_URL = 'https://vh324.by3020.ihb.by:8443';
const USER = 'santexsistem_gmail_com6809';
const PASS = '27cwr7UCn%%8JDU';
const DOMAIN = 'vh324.by3020.ihb.by';

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

(async () => {
const browser = await chromium.launch({ headless: false, slowMo: 250 });
const page = await browser.newPage({ ignoreHTTPSErrors: true });

try {
  console.log('[1] Логин...');
  await page.goto(PLESK_URL, { timeout: 60000 });
  await sleep(2000);
  await page.fill('input[name="login_name"]', USER);
  await page.fill('input[name="passwd"]', PASS);
  await page.click('button:has-text("Войти")');
  await page.waitForLoadState('domcontentloaded');
  await sleep(4000);

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
    await sleep(200);
    await page.keyboard.press('Enter');
  }
  await sleep(3000);

  const url1 = page.url();
  const domIdMatch = url1.match(/\/id\/(\d+)\//);
  if (!domIdMatch) {
    console.log(`   ❌ Неверный домен: ${url1}`);
    throw new Error('Wrong domain selected');
  }
  const domId = domIdMatch[1];
  console.log(`   ✅ Домен (dom_id=${domId})`);

  console.log('[3] Node.js — перезапуск приложения...');
  await page.goto(`${PLESK_URL}/modules/nodejs/index.php/domain/index?dom_id=${domId}&site_id=${domId}`, { timeout: 30000, waitUntil: 'domcontentloaded' });
  await sleep(3000);

  // Кнопка "Перезапустить приложение" (или restart icon)
  const restartBtn = page.locator('button:has-text("Перезапустить"), a:has-text("Перезапустить")').first();
  if (await restartBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
    await restartBtn.click();
    await sleep(2000);
    console.log('   ✅ Перезапустить приложение');
    // Подтверждение в модалке
    for (const btn of await page.locator('button').all()) {
      const t = (await btn.textContent())?.trim();
      if (t === 'OK' || t === 'Да' || t === 'Перезапустить') {
        await btn.click();
        await sleep(1500);
        break;
      }
    }
  } else {
    // fallback: иконка перезапуска (svg/кнопка без текста)
    const icon = page.locator('button[title*="ерезапустить"], button[data-test-id*="restart"], .js-restart-app').first();
    if (await icon.isVisible({ timeout: 3000 }).catch(() => false)) {
      await icon.click();
      await sleep(2000);
      console.log('   ✅ Restart (иконка)');
    } else {
      console.log('   ⚠️ Кнопка перезапуска не найдена');
    }
  }

  await sleep(3000);
  console.log('\n✅ Приложение перезапущено.');
  await browser.close();
  console.log('   ✅ Браузер закрыт');
} catch (e) {
  console.error('❌', e.message);
  await page.screenshot({ path: 'restart-err.png' }).catch(() => {});
  await browser.close();
}
})();
