# План: ShowHamburger — desktop-панель + табы «Категории / Посадка / Меню», поиск, голос

> **Статус:** реализовано (08.26–09.24). Подробности — в истории git.
> **Осталось в файле:** только действующие конвенции и отложенные блоки.
> **Связанное:** `.kilo/plans/1778783966963-style-guide.md` (§13 dialog, §14 Popover/Anchor),
> `frontend/docs/style/patterns.md`. Дата: старт 2026-08-26.

---

## Действующие конвенции (соблюдаем)

- **Брейкпоинт:** `> $mobile` (767.98px) — desktop-режим (диалог in-place, без телепорта);
  `≤ 768` — full-screen оверлей (`100dvw/100dvh`), телепорт в `<body>` только при `isMobile`.
- **Инстансы:** два диалога с разными id (через проп): `hamburgerCatalogDesktop` (desktop-панель)
  и `hamburgerDialog` (mobile-оверлей); у каждого свой ключ `useDialog`. Desktop открыт по умолчанию
  (SSR: `initialOpen` + `:open="isOpen"`), mobile — по кнопке.
- **Ширина панели** — единый источник `--catalog-width` (`@include adaptiveValue("--catalog-width", 320, 235)`
  в `:root`, `styles.scss`); ширина кнопки/диалога и сдвиг контента считаются от неё.
- **Сдвиг контента** по `isOpen` (`useCatalogPanel`, id-only чтение): только первый блок
  (`margin-inline-start: var(--catalog-width)` + transition). Desktop-панель контент **не затемняет**;
  mobile-оверлей затемняет (`HeroGrids`/`USocials` читают mobile-состояние).
- **3 слайда ≤ `$tablet`:** `Категории | Посадка | Меню` — `USlider` (табы + точки + свайп синхронны),
  шапка панели: поиск на всю ширину + голос + кнопка закрытия. Desktop ≥1024 — панель-каталог как была.
- **Аккордеон:** общий `UAccordion`; вложенные подкатегории — `<details>` (клик раскрывает, не переходит),
  своя группа `name="faq-${cat.slug}"` (иначе конфликт с нативной эксклюзивностью). Активные ссылки —
  по `route.path`, акцент `--danger-color` + вес 700.
- **Попапы:** нативный Popover API + Anchor Positioning + `flip-block` (style-guide §14); закрытие —
  нативный light-dismiss/Escape. Модальные формы — `<dialog>` + `showModal`.

---

## Отложено

### 1. Anchor Positioning для desktop-панели
Сейчас рабочий fallback: `position: absolute; top: calc(100% + 22px)`.
Переход на anchor (по анализу 09.09):
1. В desktop-ветке убрать `inset: auto` — shorthand затирает вычисленные от якоря инсеты;
   вместо него `inset-inline: auto 0` + `margin-block-start: toRem(22)`.
2. `anchor-name: --hamburger-menu` перенести на **desktop**-кнопку
   (`.hamburger_desktop .hamburger-menu`), иначе якорь матчит mobile.
3. Базу `inset: 0` (mobile) оставить — desktop-ветка её больше не перебивает.
Обернуть в `@supports (anchor-name: --x)`, иначе — текущий absolute (прогрессивное улучшение).

### 2. Калькулятор заготовок (2-й этап)
- Рецепты «под задачу»: сок, компот, морс, варенье, джем, пюре (нормы условные, набор уточняется).
  Многосоставные (консервация/соленья/лечо) — требуют выбора нескольких продуктов, позже.
- Доставка (вес/зона → стоимость) — правилами **в корзине**, не отдельным калькулятором.
- Тех. ограничение корзины: `CartItem.quantity` — целое; `addToCart` не принимает `quantity`
  → нужно расширить (`addToCart(product, slug, sub, quantity?)`), расчёт — в целых кг (`Math.ceil`).

### 3. Смежное (ведётся в `frontend/docs/plan.md`)
- Типизация (`vue-tsc --noEmit`), локализация ru/be по всем данным.
