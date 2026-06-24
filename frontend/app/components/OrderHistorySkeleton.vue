<template>
  <div class="skeleton-list">
    <div v-for="i in 3" :key="i" class="skeleton-list__item">
      <div class="skeleton-list__lines">
        <div class="skeleton-list__line skeleton-list__line_short" />
        <div class="skeleton-list__line skeleton-list__line_medium" />
      </div>
      <div class="skeleton-list__line skeleton-list__line_price" />
      <div class="skeleton-list__line skeleton-list__line_link" />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.skeleton-list {
  display: grid;
  gap: toRem(12);

  &__item {
    display: grid;
    grid-template-columns: 1fr auto auto;
    gap: toRem(16);
    align-items: center;
    padding: toRem(16);
    background: var(--bg-secondary);
    border-radius: toRem(10);
  }

  &__lines {
    display: grid;
    gap: toRem(8);
  }

  &__line {
    height: toRem(14);
    border-radius: toRem(4);
    background: linear-gradient(90deg, var(--border-color) 25%, var(--bg-hover) 50%, var(--border-color) 75%);
    background-size: 200% 100%;
    animation: shimmer 1.5s ease-in-out infinite;

    &_short {
      width: 60%;
    }

    &_medium {
      width: 40%;
    }

    &_price {
      width: toRem(70);
    }

    &_link {
      width: toRem(60);
    }
  }
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
</style>
