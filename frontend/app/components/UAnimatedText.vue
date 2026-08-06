<script setup lang="ts">
interface Props {
  text?: string
  variant?: "wave" | "typewriter" | "gradient" | "floating" | "slide-in"
}

withDefaults(defineProps<Props>(), {
  text: "Organick",
  variant: "wave",
})
</script>

<template>
  <div
    role="img"
    :class="['u-animated-text', `u-animated-text_${variant}`]"
    :aria-label="text"
  >
    <template v-if="variant === 'typewriter'">
      <span
        v-for="(char, i) in text"
        :key="i"
        class="u-animated-text__char"
        :style="{ animationDelay: `${i * 0.08}s` }"
      >{{ char === ' ' ? '\u00A0' : char }}</span>
    </template>

    <template v-else-if="variant === 'floating'">
      <span
        v-for="(char, i) in text"
        :key="i"
        class="u-animated-text__char"
        :style="{ animationDelay: `${i * 0.05}s` }"
      >{{ char === ' ' ? '\u00A0' : char }}</span>
    </template>

    <template v-else-if="variant === 'gradient'">
      <h2 class="u-animated-text__title">{{ text }}</h2>
    </template>

    <template v-else-if="variant === 'slide-in'">
      <h2 class="u-animated-text__title">{{ text }}</h2>
    </template>

    <template v-else>
      <h2 class="u-animated-text__title u-animated-text__title_outline">{{ text }}</h2>
      <h2 class="u-animated-text__title u-animated-text__title_wave" aria-hidden="true">{{ text }}</h2>
      <h2 class="u-animated-text__title u-animated-text__title_shadow" aria-hidden="true">{{ text }}</h2>
    </template>
  </div>
</template>

<style lang="scss" scoped>
.u-animated-text {
  position: relative;
  left: toRem(45);
  padding: toRem(2);

  &__title {
    position: absolute;
    left: 50%;
    top: 50%;
    translate: -50% -50%;
    letter-spacing: 1.2px;
    font-weight: 600;
    font-size: toEm(22);
    white-space: nowrap;

    &_outline {
      color: transparent;
      -webkit-text-stroke: 1px var(--main-color);
      filter: blur(0.3px);
    }
    &_wave {
      z-index: 10;
      color: #0369a1;
      animation: u-animated-text-wave 5s ease-in-out infinite;
    }
    &_shadow {
      z-index: 10;
      color: rgba(127, 113, 99, 0.3);
    }
  }

  &__char {
    display: inline-block;
    animation-duration: 0.6s;
    animation-fill-mode: both;
  }

  // ===== TYPEWRITER =====
  &_typewriter {
    .u-animated-text__char {
      animation-name: u-animated-text-typewriter;
    }
  }

  // ===== FLOATING =====
  &_floating {
    .u-animated-text__char {
      animation-name: u-animated-text-float;
      animation-duration: 1.2s;
      animation-iteration-count: infinite;
      animation-direction: alternate;
      animation-timing-function: ease-in-out;
    }
  }

  // ===== GRADIENT =====
  &_gradient {
    .u-animated-text__title {
      // Яркие стопы (#9acd32, #ff8c00) на светлом не проходили AA —
      // заменены на тёмные аналоги (все стопы ≥ 4.5:1)
      background: linear-gradient(90deg, #54701a, #b45309, #b91c1c, #54701a);
      background-size: 300% 100%;
      -webkit-background-clip: text;
      background-clip: text;
      color: transparent;
      animation: u-animated-text-gradient 4s linear infinite;
    }
  }

  // ===== SLIDE-IN =====
  &_slide-in {
    overflow: hidden;

    .u-animated-text__title {
      animation: u-animated-text-slide-in 1s ease-out both;
    }
  }
}

@keyframes u-animated-text-wave {
  0%, 100% {
    clip-path: polygon(0% 56%, 3% 53%, 7% 48%, 11% 42%, 16% 37%, 23% 36%, 29% 35%, 34% 37%, 40% 40%, 45% 44%, 49% 48%, 53% 52%, 57% 57%, 60% 61%, 64% 67%, 69% 71%, 74% 71%, 78% 68%, 80% 62%, 83% 59%, 85% 54%, 90% 51%, 93% 47%, 97% 43%, 99% 38%, 100% 98%, 0% 98%);
  }
  50% {
    clip-path: polygon(0% 63%, 3% 59%, 8% 59%, 11% 62%, 18% 66%, 23% 68%, 30% 66%, 35% 64%, 38% 60%, 42% 58%, 45% 55%, 49% 53%, 53% 49%, 60% 46%, 64% 44%, 68% 42%, 73% 40%, 78% 39%, 81% 37%, 85% 36%, 89% 33%, 91% 29%, 94% 27%, 97% 25%, 100% 21%, 100% 100%, 0% 99%);
  }
}

@keyframes u-animated-text-typewriter {
  from {
    opacity: 0;
    translate: 0 toRem(8);
  }
  to {
    opacity: 1;
    translate: 0 0;
  }
}

@keyframes u-animated-text-gradient {
  0% { background-position: 0% 50%; }
  100% { background-position: 300% 50%; }
}

@keyframes u-animated-text-float {
  0% { translate: 0 0; }
  100% { translate: 0 toRem(-6); }
}

@keyframes u-animated-text-slide-in {
  from {
    opacity: 0;
    translate: -100% -50%;
  }
  to {
    opacity: 1;
    translate: -50% -50%;
  }
}
</style>
