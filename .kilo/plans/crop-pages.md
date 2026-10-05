# Страницы растений (`crop`) в разделе «Посадка» — ✅ РЕАЛИЗОВАНО

> Статус (05.10.2026). Реализация — 30.09; sitemap — 30.09.

## Сделано

- Проп `initialItemId` в `CalcSection` (предвыбор культуры).
- `pages/[lang]/posadka-i-urozhay.vue` → папка (`index.vue` + `[cropSlug].vue`).
- Страница растения: крошки `UBreadcrumbs` (+ фон из `global.breadcrumbs` через
  `useBreadcrumbsBackground`), hero `UImage`, MDC-описание, калькулятор с предвыбором, «Другие растения»,
  FAQ, JSON-LD WebPage+Breadcrumb, canonical/OG, скрытый SEO-блок, 404, fallback `ru` для `be`.
- Перелинковка: растения в SEO-блоке хаба — ссылками; в панели чипы остаются **кнопками**.
- Sitemap (`server/api/__sitemap__/urls.ts`): `/{lang}/posadka-i-urozhay/{slug}` (ru — 5/5, всего 75 URL).
- Описания растений (ru) — заполнены (проверено 05.10: `shortDescription` + `description` у 5/5).
- **Отклонено:** SSR статей в панели каталога (решение 28.09) — не нужно.

## Осталось

- **`be`-локали растений — блокер 403.** `PUT /api/crops/{documentId}?locale=be` → 403 (нужны права
  на `Crop`). Переводы 5 растений готовы. Пока в `be` растений нет → их страницы в sitemap не попадают
  (появятся автоматически после локализации).
