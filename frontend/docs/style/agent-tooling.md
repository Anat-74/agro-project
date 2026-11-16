# Инструменты агента для визуальной работы (актуально на 16.11.2026)

## Что есть и работает
- **`scripts/shot.mjs`** — скриншоты страницы/элемента **без MCP** (Playwright):
  `node ../scripts/shot.mjs <url> <selector> <out.png> [WxH] [close-filter|magenta-bg]`
  Запускать из `frontend` (там playwright).
- **`pixelmatch` 8 + `pngjs` 7** (devDependencies `frontend`) — попиксельное сравнение PNG:
  число различающихся пикселей, процент, карта различий. Основной инструмент приёмки визуала
  (см. раздел ниже — **не пренебрегать**).
- **`sharp`** — попиксельный diff и измерения (зазоры, размеры, bbox расхождения).
- **`potrace`** (devDependency) — трассировка битмапа в SVG path: снимаем контур с маски → получаем явную геометрию.
- **`playwright`** (devDependency) — headless-навигация/evaluate/скриншоты; не зависит от «живости» MCP-таба.

## Пиксельное сравнение (pixelmatch) — обязательный шаг проверки

Любая правка формы, маски, выреза, позиционирования или типографики **закрывается числом**,
а не «вроде похоже». Отчёт без diff-цифры считается незавершённым.

### Что даёт
- **diffPx / diffPct** — сколько пикселей изменилось (`0 px` = правка ничего не задела).
- **Карта различий** (diff-PNG от `pixelmatch`) — видно *где* легли изменения; можно открыть и посмотреть.
- **Bounding box различий** — «изменилось только в зоне выреза 46×26 px, остальная карточка не тронута».
- **Порог** (`threshold`, по умолчанию 0.1) и `includeAA` — отделить настоящие изменения от шума сглаживания.
- **ROI** — сравнивать только нужную область (например, вырез), игнорируя фото товара.
- **Сравнение состояний**: до/после правки, compact vs filter-open, 390 vs 411, DPR 2.625 vs 3,
  Chromium vs WebKit — всё числом, без «на глаз».
- **Автотест**: рендер через Playwright + `expect(diffPct <= 0.05)` — защита от случайной CSS-регрессии.

### Рецепт (frontend/.tmp/или scripts)
```js
import { chromium } from 'playwright'
import { PNG } from 'pngjs'
import pixelmatch from 'pixelmatch'
import fs from 'node:fs'

const b = await chromium.launch()
const p = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3 })
await p.goto('http://localhost:3000/ru/products', { waitUntil: 'domcontentloaded' })
await p.waitForFunction(() => !!document.querySelector('.product-card_compact')) // ждать состояние, не sleep
await p.waitForTimeout(500)
await p.locator('.product-card').first().screenshot({ path: '.tmp/a.png' })
// ... изменить состояние/перезагрузить ...
await p.locator('.product-card').first().screenshot({ path: '.tmp/b.png' })
await b.close()

const i1 = PNG.sync.read(fs.readFileSync('.tmp/a.png'))
const i2 = PNG.sync.read(fs.readFileSync('.tmp/b.png'))
const diff = new PNG({ width: i1.width, height: i1.height })
const n = pixelmatch(i1.data, i2.data, diff.data, i1.width, i1.height, { threshold: 0.1 })
fs.writeFileSync('.tmp/diff.png', PNG.sync.write(diff)) // карта различий
console.log(n, (n / (i1.width * i1.height) * 100).toFixed(3) + '%')
```

### Правила детерминизма (иначе diff = шум)
- Ждать **устойчивое состояние** (`waitForFunction` по классу/данным), а не фиксированный `sleep`.
- Одинаковые вьюпорт, DPR и состояние (фильтр, колонки, hover вне элемента).
- Анимации/переходы остановить (перевести в конечное состояние), lazy-фото должны быть загружены.
- Сравнивать только PNG одного размера; `size mismatch` — это ошибка теста, а не «разница».

### Ориентиры
- Неизменный рендер: **0 px** (проверено: карточка после перезагрузки).
- Сдвиг на 1 px: тысячи пикселей; смена цвета плашки: десятки–сотни; AA-шум: сотые доли процента.
- Нельзя использовать телефонный JPEG из мессенджера как эталон (сжатие + масштаб). Нужен PNG файлом
  в полном разрешении либо собственный рендер при DPR устройства (2.625 для Mi A2 Lite).

## Что не сработало
- **`glimpse-mcp` (0.1.1)** — не находит Chromium даже при установленном полном браузере
  (свой Playwright, 0.1.x, 1 мейнтейнер); отключён и удалён из `.kilo/kilo.json`.
- **Playwright-MCP** периодически сбрасывает таб в `about:blank` (перезапуск сервера/контекста).
  Для доказательств — использовать `shot.mjs`, MCP — только для ручного «тыканья».

## Пайплайн для сложных фигур (проверен)
1. Снять эталон (маску) через `shot.mjs`, с действиями: закрыть фильтр, скрыть плашки.
2. `potrace` → path.
3. Вставить path в SVG, снять оба варианта (CSS/SVG), посчитать diff через `sharp`.
4. Править координаты до diff ≈ 0 (1–2% по краю — сглаживание, норма).

## Правила, без которых пайплайн ломается
- Скриншот делать **в состоянии, где элемент виден полностью** (панель фильтра не должна перекрывать;
  плашки/подписи скрывать, если трассируется форма).
- Один параметр за итерацию, diff после каждого изменения.
- «Готово» = числа 4 сторон + кроп + diff, а не «computed styles сошлись».
