# Шаг 1. Переключение темы + ползунок яркости + анимации

---

## 1.1. Новый композабл: `useThemeBrightness.ts`

**Путь:** `composables/useThemeBrightness.ts`

```ts
export const useThemeBrightness = () => {
  const brightness = ref(50)

  const setBrightness = (value: number) => {
    brightness.value = Math.min(100, Math.max(0, value))
  }

  return { brightness, setBrightness }
}
```

> **Почему отдельный композабл:** не смешивать с `useColorMode` — theme и brightness независимы.
> **SSR-безопасность:** `ref(50)` — дефолт 50%, на клиенте синхронизируется через ползунок.

---

## 1.2. `UInput.vue` — добавить `type="range"`

### Что меняется в `<script>`:

```ts
type InputType = 'text' | 'textarea' | 'search' | 'email' | 'password'
               | 'number' | 'tel' | 'url' | 'checkbox' | 'range'
```

### Что добавляется в `<template>`:

```vue
<div v-else-if="type === 'range'" class="u-input__range-wrapper">
  <input
    :id="inputId"
    type="range"
    v-model="model"
    :min="min"
    :max="max"
    :step="step"
    :disabled="disabled"
    class="u-input__range"
  />
</div>
```

### Новые props:

```ts
interface Props {
  min?: number
  max?: number
  step?: number
}
```

### Стилизация range (добавить в `<style>`):

```scss
.u-input {
  &__range-wrapper {
    width: 100%;
  }

  &__range {
    -webkit-appearance: none;
    appearance: none;
    width: 100%;
    height: toRem(6);
    border-radius: toRem(4);
    background: var(--border-color);
    outline: none;
    cursor: pointer;
    transition: background var(--transition-duration);

    &::-webkit-slider-thumb {
      -webkit-appearance: none;
      appearance: none;
      width: toRem(18);
      height: toRem(18);
      border-radius: 50%;
      background: var(--primary-color);
      border: toRem(2) solid var(--light-color);
      box-shadow: 0 toRem(2) toRem(8) rgba(0, 0, 0, 0.15);
      cursor: pointer;
      transition: transform var(--transition-duration),
                  background var(--transition-duration);
    }

    &::-moz-range-thumb {
      width: toRem(18);
      height: toRem(18);
      border-radius: 50%;
      background: var(--primary-color);
      border: toRem(2) solid var(--light-color);
      box-shadow: 0 toRem(2) toRem(8) rgba(0, 0, 0, 0.15);
      cursor: pointer;
    }

    &::-moz-range-track {
      height: toRem(6);
      border-radius: toRem(4);
      background: var(--border-color);
    }
  }
}
```

---

## 1.3. `ColorMode.vue` — расширить

**Текущий вид** (3 кнопки темы):

```vue
<ul class="color-mode">
  <li v-for="theme of ['light', 'dark', 'custom']" :key="theme" class="color-mode__item">
    <UButton @click="colorMode.preference = theme" variant="color-theme"
      :icon="iconName(theme)" :theme="theme" :aria-label="theme" />
  </li>
</ul>
```

**Новый вид** (3 кнопки + ползунок яркости):

```vue
<script setup lang="ts">
const colorMode = useColorMode()
const { brightness, setBrightness } = useThemeBrightness()

function iconName(theme: string) {
  if (theme === 'light') return 'ph:sun-duotone'
  if (theme === 'dark') return 'ph:moon-light'
  return 'ph:coffee'
}
</script>

<template>
  <div class="color-mode">
    <ul class="color-mode__themes">
      <li v-for="theme of ['light', 'dark', 'custom']" :key="theme" class="color-mode__item">
        <UButton @click="colorMode.preference = theme" variant="color-theme"
          :icon="iconName(theme)" :theme="theme" :aria-label="theme" />
      </li>
    </ul>
    <div class="color-mode__brightness">
      <UInput type="range" v-model="brightness" min="0" max="100" step="1"
        @update:model-value="setBrightness" />
    </div>
  </div>
</template>
```

### Стили `ColorMode.vue` (полностью):

```scss
.color-mode {
  display: flex;
  flex-direction: column;
  row-gap: toRem(8);

  &__themes {
    display: inline-flex;
    column-gap: toRem(4);

    @media (max-width: $mobile) {
      flex-direction: column;
      row-gap: toRem(6);
    }

    // Анимации входа — @container внутри BEM-класса
    @container style(--theme: custom) {
      animation: fadeInScale 0.4s cubic-bezier(0.22, 1, 0.36, 1) forwards;
    }
  }

  &__brightness {
    padding-inline: toRem(2);

    // При custom-теме — нестандартный вид ползунка
    @container style(--theme: custom) {
      .u-input__range {
        background: linear-gradient(
          90deg,
          var(--primary-color),
          var(--warning-color),
          var(--danger-color)
        );
        height: toRem(8);
        border-radius: toRem(4);
        animation: brightnessTrackPulse 2s ease-in-out infinite;

        &::-webkit-slider-thumb {
          width: toRem(22);
          height: toRem(22);
          background: var(--light-color);
          border: toRem(3) solid var(--warning-color);
          box-shadow: 0 0 toRem(12) var(--warning-color),
                      0 toRem(2) toRem(8) rgba(0, 0, 0, 0.2);
          animation: brightnessThumbGlow 2s ease-in-out infinite;
        }

        &::-moz-range-thumb {
          width: toRem(22);
          height: toRem(22);
          background: var(--light-color);
          border: toRem(3) solid var(--warning-color);
          box-shadow: 0 0 toRem(12) var(--warning-color),
                      0 toRem(2) toRem(8) rgba(0, 0, 0, 0.2);
        }
      }
    }

    // Анимация появления для custom-темы
    @container style(--theme: custom) {
      animation: slideUp 0.4s cubic-bezier(0.22, 1, 0.36, 1) 0.15s forwards;
      opacity: 0;
    }
  }
}

@keyframes fadeInScale {
  from { opacity: 0; transform: scale(0.9); }
  to { opacity: 1; transform: scale(1); }
}

@keyframes slideUp {
  from { opacity: 0; transform: translateY(toRem(8)); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes brightnessTrackPulse {
  0%, 100% { filter: brightness(1); }
  50% { filter: brightness(1.15); }
}

@keyframes brightnessThumbGlow {
  0%, 100% {
    box-shadow: 0 0 toRem(12) var(--warning-color),
                0 toRem(2) toRem(8) rgba(0, 0, 0, 0.2);
  }
  50% {
    box-shadow: 0 0 toRem(20) var(--warning-color),
                0 toRem(2) toRem(12) rgba(0, 0, 0, 0.3);
  }
}
```

> **Почему `@container style()` внутри классов, а не снаружи:**
> 1. Каждый BEM-класс сам описывает своё поведение — не нужно искать внешний блок.
> 2. Нет дублирования селекторов.
> 3. SCSS-вложенность даёт понятную иерархию.
> 4. При удалении класса удаляются и его container-стили.
>
> Исключение (внешний `@container`) допустимо только для группового применения к разным компонентам.

---

## 1.4. `app.vue` — корневой контейнер

**Текущий вид:**

```vue
<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
```

**Новый вид:**

```vue
<script setup lang="ts">
// ... существующие импорты
const colorMode = useColorMode()
const { brightness } = useThemeBrightness()
const { currentLocale } = useLocale()

const containerVars = computed(() => ({
  '--theme': colorMode.preference,
  '--brightness': brightness.value,
  '--locale': currentLocale.value,
}))
</script>

<template>
  <div :style="containerVars">
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>
```

> **Почему `computed`:** реактивно обновляется при смене темы/яркости/языка, не создавая лишних watcher-ов.

---

## 1.5. `styles.scss` — переменная яркости

**Добавить во все три блока (`.light-mode`, `.dark-mode`, `.custom-mode`):**

```scss
--bg-brightness: hsl(0, 0%, calc(var(--brightness, 50) * 1%));
```

**Где именно:** после `--transition-duration`, до основных цветов.

### Выбор стратегии: `color-mix()` vs `body::after`

| Критерий | `color-mix()` на каждом компоненте | `body::after` (оверлей) |
|----------|-----------------------------------|------------------------|
| Объём кода | Нужно дописать в каждый компонент | Один раз в `_globals.scss` |
| Поддержка | `color-mix()` ~90% браузеров | `rgba()` — 100% |
| Контроль | Покомпонентный (гибкий) | Глобальный (простой) |
| Риски | Легко пропустить компонент | `pointer-events: none` — безопасно |
| Рефакторинг | N файлов | 0 файлов |

**Рекомендуется:** `body::after` — функционал яркости глобальный, оверлей проще, надёжнее и не требует рефакторинга существующих компонентов.

```scss
// _globals.scss — один раз, работает для всей страницы
body::after {
  content: '';
  position: fixed;
  inset: 0;
  pointer-events: none;
  background-color: rgba(0, 0, 0, calc(var(--brightness, 50) / 100 * 0.12));
  z-index: 9999;
  transition: background-color var(--transition-duration);
}
```

---

## 1.6. Глобальный файл анимаций

**Файл:** `assets/scss/base/_animations.scss`

```scss
// Entrance (для custom-темы)
@keyframes cardEntrance {
  from { opacity: 0; transform: translateY(toRem(30)) scale(0.96); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

@keyframes typewriter {
  from { width: 0; }
  to { width: 100%; }
}

@keyframes buttonPop {
  from { opacity: 0; transform: scale(0.8); }
  to { opacity: 1; transform: scale(1); }
}

@keyframes badgeSpin {
  from { transform: rotate(-180deg) scale(0); opacity: 0; }
  to { transform: rotate(0deg) scale(1); opacity: 1; }
}

@keyframes fadeInScale {
  from { opacity: 0; transform: scale(0.9); }
  to { opacity: 1; transform: scale(1); }
}

@keyframes slideUp {
  from { opacity: 0; transform: translateY(toRem(8)); }
  to { opacity: 1; transform: translateY(0); }
}
```

**Подключение** в `styles.scss`:

```scss
@use "./base/_animations.scss";
```

---

## 1.7. Пример: `ProductCard.vue` с `@container style()`

Фрагмент существующего `ProductCard.vue` после добавления анимаций:

```scss
.product-card {
  // ... существующие стили

  @container style(--theme: custom) {
    animation: cardEntrance 0.6s cubic-bezier(0.22, 1, 0.36, 1) forwards;
    opacity: 0;

    &__title {
      animation: typewriter 1.2s steps(30) 0.6s forwards;
      overflow: hidden;
      white-space: nowrap;
      width: 0;
    }

    &__button {
      animation: buttonPop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) 1.0s forwards;
      opacity: 0;
      transform: scale(0.8);
    }

    &__badge {
      animation: badgeSpin 1s ease 0.8s forwards;
      transform: rotate(-180deg) scale(0);
    }
  }
}
```

---

## Итоговый порядок реализации (подшаги)

| № | Действие | Файл |
|---|----------|------|
| 1 | Создать `useThemeBrightness.ts` | `composables/useThemeBrightness.ts` |
| 2 | Добавить `range` в `UInput.vue` | `components/UInput.vue` |
| 3 | Расширить `ColorMode.vue` | `components/ColorMode.vue` |
| 4 | Создать `_animations.scss` | `assets/scss/base/_animations.scss` |
| 5 | Обновить `styles.scss` (brightness + импорт анимаций) | `assets/scss/styles.scss` |
| 6 | Обновить `app.vue` (контейнер + CSS-переменные) | `app.vue` |

---

Каждый подшаг — только после твоего одобрения.