import { chromium } from 'playwright';
import { execSync } from 'child_process';

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
    // ====== 1. LOGIN ======
    console.log('[1] Login...');
    for (let i = 0; i < 5; i++) {
      try {
        await page.goto(PLESK_URL, { timeout: 30000 });
        break;
      } catch {
        if (i < 4) await sleep(15000);
        else throw new Error('Plesk недоступен после 5 попыток');
      }
    }
    await page.fill('input[name="login_name"]', USER);
    await page.fill('input[name="passwd"]', PASS);
    await page.click('button:has-text("Войти")');
    await page.waitForLoadState('domcontentloaded');
    await sleep(4000);

    // ====== 2. DOMAIN SELECT ======
    console.log('[2] Domain:', DOMAIN);
    await page.keyboard.press('Escape');
    await page.locator('#searchTerm').click();
    await sleep(500);
    // Clear search field
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
    if (!found) {
      await page.keyboard.press('ArrowDown');
      await page.keyboard.press('Enter');
    }
    await sleep(3000);
    console.log('   ✅', page.url());

    if (!page.url().includes('/id/')) {
      throw new Error('Wrong domain: ' + page.url());
    }

    // ====== 3. GIT ======
    console.log('[3] Git...');
    await page.keyboard.press('Escape');
    await page.locator('#searchTerm').click();
    await sleep(300);
    await page.keyboard.press('Control+a');
    await page.keyboard.press('Delete');
    await page.keyboard.type('Git', { delay: 50 });
    await sleep(2500);
    for (const item of await page.locator('[role="option"]').all()) {
      if ((await item.textContent())?.trim() === 'Git') {
        await item.click(); break;
      }
    }
    await sleep(2000);
    console.log('   ✅ Git страница');

    // Получить сейчас
    const pullBtn = page.locator('button.pul-button').first();
    if (await pullBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await pullBtn.click(); await sleep(2000);
      const closeBtn = page.locator('button:has-text("Закрыть")');
      if (await closeBtn.isVisible({ timeout: 3000 }).catch(() => false)) await closeBtn.click();
      await sleep(1000);
      console.log('   ✅ Получить сейчас');
    }

    // Развернуть сейчас
    const deployBtn = page.locator('button[data-test-id="deploy-btn"]');
    if (await deployBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await deployBtn.click(); await sleep(2000);
      const closeBtn = page.locator('button:has-text("Закрыть")');
      if (await closeBtn.isVisible({ timeout: 3000 }).catch(() => false)) await closeBtn.click();
      await sleep(1000);
      console.log('   ✅ Развернуть сейчас');
    }

    // ====== 4. NODE.JS BUILD ======
    console.log('[4] Node.js...');
    await page.keyboard.press('Escape');
    await page.locator('#searchTerm').click();
    await sleep(300);
    await page.keyboard.press('Control+a');
    await page.keyboard.press('Delete');
    await page.keyboard.type('node.js', { delay: 50 });
    await sleep(2500);
    for (const item of await page.locator('[role="option"]').all()) {
      if ((await item.textContent())?.trim() === 'Node.js') {
        await item.click(); break;
      }
    }
    await sleep(3000);
    console.log('   ✅ Node.js страница');

    const runBtn = page.locator('button[data-test-id="run-script-button"]');
    if (await runBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await runBtn.click(); await sleep(1500);
      console.log('   ✅ run-script-button');

      const input = page.locator('input.pul-input__input').last();
      if (await input.isVisible({ timeout: 3000 }).catch(() => false)) {
        await input.fill('build'); await sleep(500);
        console.log('   ✅ build введён');

        const launchBtn = page.locator('button.pul-toolbar__group-item').filter({ hasText: 'Запустить' });
        if (await launchBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
          await launchBtn.click();
          console.log('   ✅ Нажата кнопка "Запустить"');
        }
      }
    }

    console.log('\n✅ Build для api запущен!');
  } catch (e) {
    console.error('❌', e.message);
  } finally {
    await browser.close();
  }
})();
