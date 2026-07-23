# Правила автоматизации деплоя (Plesk + Playwright)

## 0. Критические ошибки, которые нужно избегать

### 0.0 Разграничение commit / push / deploy
- **"закомить"** = `git add + git commit`. Только локально, без отправки на сервер.
- **"запуш" / "запушкать"** = `git push`.
- **"деплой" / "задеплой"** = `node scripts/deploy.mjs`.
- Если пользователь сказал только "закомить" — **не делать push и деплой**. Ждать явной команды.

### 0.1 SSL-сертификат Plesk (самая частая проблема)
Plesk использует самоподписанный SSL-сертификат. При `page.goto()` Playwright по умолчанию отклоняет такой сертификат и **закрывает весь контекст страницы** (browser context). После этого ЛЮБОЙ вызов `page.goto()` или `page.click()` упадёт с ошибкой `Target page, context or browser has been closed`.

**ПРАВИЛЬНЫЙ ПОДХОД (только один):**

```javascript
const browser = await chromium.launch({ headless: false });
const context = await browser.newContext({ ignoreHTTPSErrors: true });
const page = await context.newPage();
// ВСЕ операции в рамках одного context/page, без повторного создания
```

**НЕПРАВИЛЬНО (приводит к ошибке "context has been closed"):**
```javascript
// Не создавать context без ignoreHTTPSErrors
// Не вызывать page.goto() дважды на одной странице после SSL-ошибки
// Не использовать page.goto() после того как page уже закрылась
```

### 0.2 Порт 8443 временно недоступен
Иногда Plesk не отвечает на порту 8443 (сервер пингуется, но порт висит). Это временное явление — через 10-30 секунд порт восстанавливается. Не abort — повторять `page.goto()` с задержкой.

**Алгоритм ретрая:**
```javascript
for (let i = 0; i < 5; i++) {
  try {
    await page.goto(PLESK_URL, { timeout: 30000 });
    break;
  } catch {
    if (i < 4) await sleep(15000);
    else throw new Error('Plesk недоступен после 5 попыток');
  }
}
```

### 0.3 Домен выбран неправильно
В выпадающем списке после поиска может быть ДРУГОЙ поддомен (createx.vh324.by3020.ihb.by). Нужно проверять URL на `/id/589/`.

### 0.4 Отключение Node.js вместо запуска скрипта
Кнопка "Отключить Node.js" находится рядом с "Запустить скрипт". Ввод текста и Enter на НЕПРАВИЛЬНОМ поле ввода может отключить Node.js. Использовать ТОЛЬКО прямые селекторы.

---

## 1. Технические требования к скрипту

- **Библиотека:** Playwright (`chromium.launch`)
- **SSL:** `ignoreHTTPSErrors: true` в `browser.newContext()`
- **Процесс:** Один скрипт, один browser, один context, одна страница
- **Поведение:** headless: false (видимый браузер, чтобы видеть что происходит)
- **Язык:** Node.js (ES modules или CommonJS)

## 2. Полный deployment-скрипт (шаги 1-5)

### Шаг 1. Запуск браузера
```javascript
const browser = await chromium.launch({ headless: false, slowMo: 300 });
const context = await browser.newPage({ ignoreHTTPSErrors: true });
const page = await context.newPage();
```

### Шаг 2. Логин в Plesk
```
URL:        https://vh324.by3020.ihb.by:8443
Поле:       input[name="login_name"]        → USER
Поле:       input[name="passwd"]             → PASS
Кнопка:     button:has-text("Войти")         → click
Ожидание:   waitForLoadState('domcontentloaded') + 4s пауза
```

**Учётные данные:**
```javascript
const USER = 'santexsistem_gmail_com6809';
const PASS = '27cwr7UCn%%8JDU';
```

### Шаг 3. Выбор домена vh324.by3020.ihb.by
```
1. Escape (закрыть возможный overlay)
2. search input: page.locator('#searchTerm').click()
3. Ctrl+A, Delete (очистить поле)
4. Напечатать 'vh324.by3020.ihb.by'
5. Ждать 2.5 секунды (появления выпадающего списка)
6. Перебрать все [role="option"]:
   - для каждого: получить textContent().trim()
   - если строго равен 'vh324.by3020.ihb.by': click()
7. Ждать 3 секунды
8. ПРОВЕРКА: page.url() должен содержать '/id/589/'
   - если НЕТ: abort, закрыть браузер, начать заново
```

### Шаг 4. Git fetch + deploy
```
1. Escape
2. page.locator('#searchTerm').click()
3. Ctrl+A, Delete, напечатать 'Git', ждать 2с
4. Найти [role="option"] с текстом 'Git' → click()
   (НЕ 'Развернуть с помощью Git')
5. Ждать 3с
6. ПРОВЕРКА: .page-content-header__title содержит 'Репозитории Git на vh324.by3020.ihb.by'
7. Кнопка "Получить сейчас":
   - page.locator('button:has-text("Получить сейчас")').click()
   - Ждать 2с
   - Закрыть диалог: найти кнопку с текстом "Закрыть" → click() → Escape
8. Кнопка "Развернуть сейчас":
   - page.locator('button[data-test-id="deploy-btn"]').click()
   - Ждать 2с
   - Закрыть диалог: найти кнопку с текстом "Закрыть" → click() → Escape
```

### Шаг 5. Node.js — запуск build
```
1. Escape → #searchTerm → Ctrl+A, Delete → напечатать 'node.js' → ждать 2с
2. Найти [role="option"] с текстом 'Node.js' → click()
3. Ждать 3с
4. ПРОВЕРКА: .page-content-header__title содержит 'Node.js на vh324.by3020.ihb.by'
5. "Запустить скрипт":
   - page.locator('button[data-test-id="run-script-button"]').click()
   - Ждать 2с (появления модального окна)
6. Поле ввода команды:
   - Перебрать все input.pul-input__input, найти тот, у которого id !== 'searchTerm'
   - Или page.locator('input.pul-input__input').nth(1) — второй input на странице
   - Ввести 'build'
7. Кнопка "Запустить":
   - page.locator('button').all() — перебрать ВСЕ кнопки
   - Найти с текстом строго === 'Запустить'
   - click()
8. НЕ ждать завершения
```

### Шаг 6. Отчёт
```
- Сделать скриншот
- Сообщить пользователю: "✅ Build запущен через 3-5 мин проверь сайт"
- Добавить: "Скажи 'перезапусти' для перезапуска приложения"
```

---

## 3. Шаг 6 (отдельно, по команде пользователя)

**Запускать только когда пользователь сказал "перезапусти" не раньше чем через 3 минуты после build**

1. Выполнить шаги 2 (логин) и 3 (выбор домена)
2. Выполнить шаг 5.1-5.4 (поиск node.js, проверка заголовка)
3. Кнопка "Перезапустить приложение":
   - Ждать до 15с, пока кнопка станет видимой (иногда загружается с задержкой)
   - Перед кликом — `scrollIntoViewIfNeeded()`
   ```
   const restartBtn = page.locator('button[data-test-id="restart-domain-button"]')
   if (await restartBtn.isVisible({ timeout: 15000 }).catch(() => false)) {
     await restartBtn.scrollIntoViewIfNeeded()
     await page.waitForTimeout(500)
     await restartBtn.click()
   Ждать 20с (Passenger перезапускается)
   ```
4. Сообщить пользователю

---

## 4. Справочник селекторов Plesk (DOM)

| Элемент | Селектор | Комментарий |
|---------|----------|-------------|
| Поле логина | `input[name="login_name"]` | |
| Поле пароля | `input[name="passwd"]` | |
| Кнопка "Войти" | `button:has-text("Войти")` | |
| Поиск (глобальный) | `#searchTerm` | В header, класс pul-input__input |
| Результат поиска | `[role="option"]` | Сравнивать по textContent.trim() |
| Заголовок страницы | `.page-content-header__title` | Проверять содержит домен |
| "Получить сейчас" | `button:has-text("Получить сейчас")` | На странице Git |
| "Развернуть сейчас" | `button[data-test-id="deploy-btn"]` | На странице Git |
| "Закрыть" (диалог) | Кнопка с текстом "Закрыть" | После Git операций |
| "Запустить скрипт" | `button[data-test-id="run-script-button"]` | На странице Node.js |
| Поле ввода команды | `input.pul-input__input` (не `#searchTerm`) | В модалке после клика |
| Кнопка "Запустить" | `button` с точным текстом `=== "Запустить"` | В модалке |
| "Перезапустить приложение" | `button[data-test-id="restart-domain-button"]` | На странице Node.js |
| "Отключить Node.js" | НЕ нажимать! Проверить текст | Рядом с run-script-button |
| Кнопка подтверждения | `button:has-text("Да")` | После перезапуска |
| Overlay | Escape для закрытия | Модальные окна |

---

## 5. Проблемы и их решения

| Ситуация | Причина | Решение |
|----------|---------|---------|
| `Target page, context or browser has been closed` | SSL-ошибка при page.goto() → контекст закрылся | Всегда создавать context с `ignoreHTTPSErrors: true` |
| `page.goto()` таймаут 30с+ | Порт 8443 временно недоступен | Повторить до 5 раз с паузой 15с |
| URL содержит `/id/820/` вместо `/id/589/` | Выбран createx-поддомен | Abort, перелогин, искать точное совпадение DOMAIN |
| "Запустить" не найдена | Неправильный селектор | Искать через кнопку с текстом `=== "Запустить"` |
| Enter отключает Node.js | Фокус на неправильном поле | Не использовать Enter, только прямые селекторы |
| Edit/Write инструмент "invalid" | Kilo в --auto режиме с permissions "ask" | Добавить `"edit": "allow"` в .kilo/kilo.json |

---

## 6. Полный код deploy.mjs (для копирования)

Файл: `C:\agro-project\scripts\deploy.mjs`

**Всегда запускать через:** `node scripts/deploy.mjs` в корне проекта.
**Не использовать** `plesk-deploy_browser_*` MCP-инструменты — у них нет `ignoreHTTPSErrors`.
**Один скрипт, один browser, один context, одна страница.**

```javascript
import { chromium } from 'playwright';

const PLESK_URL = 'https://vh324.by3020.ihb.by:8443';
const USER = 'santexsistem_gmail_com6809';
const PASS = '27cwr7UCn%%8JDU';
const DOMAIN = 'vh324.by3020.ihb.by';

const browser = await chromium.launch({ headless: false, slowMo: 300 });
const context = await browser.newContext({ ignoreHTTPSErrors: true });
const page = await context.newPage();

// ... шаги 2-6 по порядку, без отклонений
```

Полный актуальный код в `scripts/deploy.mjs`.
