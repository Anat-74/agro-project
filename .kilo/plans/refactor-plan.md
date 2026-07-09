# План рефакторинга — Agro Market (вёрстка + стилизация)

> **Режим:** удалённая работа (без npm install / nuxi module add)
> **Правило:** ни шага без одобрения, после каждого шага — отчёт

---

## [В РАБОТЕ] Шаг 1. Тема + яркость + анимации

### 1.1 `useThemeBrightness.ts` — новый композабл

**Файл:** composables/useThemeBrightness.ts

- brightness = ref(50)
- setBrightness(value) — clamp 0–100

### 1.2 `UInput.vue` — добавить type="range"

**Файл:** components/UInput.vue

- InputType расширить: 'range'
- Шаблон: input type="range" с min/max/step
- Стилизация thumb (webkit + firefox) и track

### 1.3 `ColorMode.vue` — расширить

**Файл:** components/ColorMode.vue

- 3 кнопки темы (light/dark/custom) — остаются
- Ползунок яркости через UInput type="range"
- @container style(--theme: custom) для анимаций входа
- @container style(--theme: custom) для нестандартного ползунка (градиент, пульсация)

### 1.4 `_animations.scss` — глобальные keyframes

**Файл:** assets/scss/base/_animations.scss

- cardEntrance, typewriter, buttonPop, badgeSpin, fadeInScale, slideUp
- brightnessTrackPulse, brightnessThumbGlow

### 1.5 `_mixins.scss` — миксин colorMix (Medium)

**Файл:** assets/scss/foundation/_mixins.scss

```scss
@mixin colorMix(
  $property: background-color,
  $base-color: var(--bg),
  $darken-color: rgba(0, 0, 0, 0.08)
) {
  #{$property}: color-mix(
    in srgb,
    $base-color calc(100% - var(--brightness, 50) * 0.5%),
    $darken-color
  );
}
```

Использование:
```scss
.product-card {
  @include colorMix();                                   // фон карточки
  @include colorMix(border-color, var(--border-color), rgba(0,0,0,0.15)); // граница
  @include colorMix(color, var(--color), rgba(0,0,0,0.05));              // текст
}
```

### 1.6 `styles.scss` — переменная яркости

**Файл:** assets/scss/styles.scss

- Добавить --bg-brightness во все три блока (.light-mode, .dark-mode, .custom-mode)

### 1.7 `app.vue` — корневой контейнер

**Файл:** app.vue

- Обёртка <div :style="containerVars"> вокруг NuxtLayout
- containerVars = computed с --theme, --brightness, --locale

---

## [ОЧЕРЕДЬ] Шаг 2. Язык + @container style(--locale)

### 2.1 CSS-переменная --locale в containerVars

**Файл:** app.vue (уже будет в 1.7, просто убедиться что --locale есть)

### 2.2 Типографика под язык в _globals.scss

**Файл:** assets/scss/base/_globals.scss

- @container style(--locale: be) для h1–h4 — font-family, letter-spacing
- @container style(--locale: ru) — letter-spacing

---

## [ОЧЕРЕДЬ] Шаг 3. @container style() в style guide

### 3.1 Документация синтаксиса и примеров

**Файл:** .kilo/plans/1778783966963-style-guide.md

- Синтаксис @container style(--var: value)
- Поддержка браузеров (88%+)
- Когда использовать vs @supports vs @include hover

---

## [НИЗКИЙ ПРИОРИТЕТ] Шаг 4. useBrowser + @container style(--browser-*)

### 4.1 Создать useBrowser.ts

**Файл:** composables/useBrowser.ts

- Определение Chrome/Firefox/Safari/Edge по User-Agent
- SSR-safe (useRequestHeaders + navigator.userAgent)

### 4.2 CSS-переменные --browser-safari и др.

**Файл:** app.vue

- Добавить в containerVars

### 4.3 Браузерные фиксы через @container style()

По компонентам — если в тестировании проявятся проблемы:
- Safari font rendering
- Firefox scrollbar
- Chrome autofill
- и т.д.

---

## Формат работы

Каждый подшаг — только после одобрения. После каждого — краткий отчёт.