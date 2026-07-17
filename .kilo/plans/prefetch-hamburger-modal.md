# Prefetch оптимизации — 2026-07-17

## Цель
Ускорить отклик UI: данные подгружаются заранее, до момента клика пользователя.

## 1. ShowHamburger — убрать `immediate: false` и `lazy: true`
**Файл:** `frontend/app/components/show-modal/ShowHamburger.vue`
**Проблема:** данные категорий и товаров грузятся только при клике на гамбургер. Пользователь видит Loader.
**Фикс:** убрать `immediate: false` и `lazy: true` → данные грузятся при монтировании страницы. К моменту клика данные готовы.

## 2. ShowModalDiscountProduct — prefetch по IntersectionObserver
**Файл:** `frontend/app/components/show-modal/ShowModalDiscountProduct.vue`
**Проблема:** детали товара грузятся только при клике "показать". Пользователь видит skeleton.
**Фикс:** добавить IntersectionObserver на обёртку компонента. Когда карточка входит в viewport (или за 100px до него) — фоново вызвать `execute()` для подгрузки данных.
