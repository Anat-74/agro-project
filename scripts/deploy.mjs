import { chromium } from 'playwright';

const PLESK_URL = 'https://vh324.by3020.ihb.by:8443';
const USER = 'santexsistem_gmail_com6809';
const PASS = '27cwr7UCn%%8JDU';
// Домен по умолчанию — фронтенд. Для Strapi: node scripts/deploy.mjs api.vh324.by3020.ihb.by
const DOMAIN = process.argv[2] || 'vh324.by3020.ihb.by';

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function searchNav(page, text, exactText) {
  await page.keyboard.press('Escape');
  await sleep(300);
  await page.locator('#searchTerm').click();
  await sleep(200);
  await page.keyboard.press('Control+a');
  await sleep(100);
  await page.keyboard.press('Delete');
  await sleep(200);
  await page.keyboard.type(text, { delay: 50 });
  await sleep(2500);

  if (exactText) {
    // Ищем точное совпадение в выпадающем списке
    for (const item of await page.locator('[role="option"], li, a').all()) {
      const t = (await item.textContent())?.trim();
      if (t === exactText || t?.startsWith(exactText)) {
        await item.click();
        await sleep(3000);
        return;
      }
    }
  }
  // fallback: первый результат
  await page.keyboard.press('ArrowDown');
  await sleep(200);
  await page.keyboard.press('Enter');
  await sleep(3000);
}

async function checkTitle(page, expectedText) {
  const title = await page.locator('.page-content-header__title').textContent().catch(() => '');
  return title.includes(expectedText);
}

async function closeOverlay(page) {
  for (let i = 0; i < 25; i++) {
    const c = page.locator('button, a, span').filter({ hasText: /Закрыть/i }).first();
    if (await c.isVisible({ timeout: 500 }).catch(() => false)) { await c.click(); await sleep(400); await page.keyboard.press('Escape'); await sleep(400); return; }
    await sleep(1000);
  }
}

(async () => {
const browser = await chromium.launch({ headless: false, slowMo: 300 });
const page = await browser.newPage({ ignoreHTTPSErrors: true });

try {
  // ====== 1. LOGIN ======
  console.log('[1] Логин...');
  await page.goto(PLESK_URL, { timeout: 60000 });
  await sleep(2000);
  await page.fill('input[name="login_name"]', USER);
  await page.fill('input[name="passwd"]', PASS);
  await page.click('button:has-text("Войти")');
  await page.waitForLoadState('domcontentloaded');
  await sleep(4000);

  // ====== 2. DOMAIN SELECT ======
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

  // Выбрать точное совпадение
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

  // Проверка домена
  const url1 = page.url();
  const domIdMatch = url1.match(/\/id\/(\d+)\//);
  if (!domIdMatch) {
    console.log(`   ❌ Неверный домен: ${url1}`);
    throw new Error('Wrong domain selected');
  }
  const domId = domIdMatch[1];
  console.log(`   ✅ ${url1} (dom_id=${domId})`);

  // ====== 3. GIT ======
  console.log('[3] Git...');
  // Прямой переход (глобальный поиск после выбора поддомена возвращает Git главного домена)
  await page.goto(`${PLESK_URL}/modules/git/index.php/domain/repositories?dom_id=${domId}&site_id=${domId}`, { timeout: 30000, waitUntil: 'domcontentloaded' });
  await sleep(3000);

  const gitTitle = await checkTitle(page, 'Репозитории Git');
  if (!gitTitle) {
    console.log('   ❌ Не Git страница, abort');
    throw new Error('Not on Git page');
  }
  console.log(`   ✅ Git страница (dom_id=${domId})`);

  // Получить сейчас
  const fetchBtn = page.locator('button:has-text("Получить сейчас")');
  if (await fetchBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await fetchBtn.click();
    await sleep(2000);
    await closeOverlay(page);
    console.log('   ✅ Получить сейчас');
  } else {
    console.log('   ⚠️ "Получить сейчас" не найдена');
  }

  // Развернуть сейчас
  const deployBtn = page.locator('button[data-test-id="deploy-btn"]');
  if (await deployBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await deployBtn.click();
    await sleep(2000);
    await closeOverlay(page);
    console.log('   ✅ Развернуть сейчас');
  }

  // ====== 4. NODE.JS BUILD ======
  console.log('[4] Node.js...');
  await page.goto(`${PLESK_URL}/modules/nodejs/index.php/domain/index?dom_id=${domId}&site_id=${domId}`, { timeout: 30000, waitUntil: 'domcontentloaded' });
  await sleep(3000);

  // Запустить скрипт
  const scriptBtn = page.locator('button[data-test-id="run-script-button"]');
  if (await scriptBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await scriptBtn.click();
    await sleep(2000);
    console.log('   ✅ run-script-button');
  }

  // Поле ввода — НЕ #searchTerm, а новое поле в модалке
  const cmdInput = page.locator('input.pul-input__input').first();
  // Проверяем что это не поиск (у поиска ширина больше или он виден в другом месте)
  const inputs = await page.locator('input.pul-input__input').all();
  let inputEl = null;
  for (const inp of inputs) {
    const id = await inp.getAttribute('id');
    if (id !== 'searchTerm') { inputEl = inp; break; }
  }
  if (inputEl) {
    await inputEl.fill('build');
    await sleep(500);
    console.log('   ✅ build введён');
  } else {
    await page.keyboard.type('build', { delay: 50 });
    await sleep(500);
  }

  // Кнопка "Запустить" — ищем среди ВСЕХ видимых кнопок точное совпадение
  const allBtns = await page.locator('button').all();
  let clicked = false;
  for (const btn of allBtns) {
    const t = (await btn.textContent())?.trim();
    if (t === 'Запустить') {
      await btn.click();
      clicked = true;
      console.log('   ✅ Нажата кнопка "Запустить"');
      break;
    }
  }
  if (!clicked) {
    // fallback — последняя надежда
    await page.keyboard.press('Tab');
    await sleep(300);
    await page.keyboard.press('Enter');
    console.log('   ⚠️ Tab+Enter');
  }

  await sleep(2000);
  console.log('\n✅ Build запущен! Через 3-5 мин проверь сайт.');
  await browser.close();
  console.log('   ✅ Браузер закрыт');

} catch (e) {
  console.error('❌', e.message);
  await page.screenshot({ path: 'deploy-err.png' }).catch(() => {});
  await browser.close();
}
})();
