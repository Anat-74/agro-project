<script lang="ts" setup>
const { currentLocale } = useLocale()
</script>

<template>
   <div class="error">
      <h1 class="error__title">404 - Страница не найдена</h1>
      <p class="error__descr">Oops! Что-то пошло не так. Страница не найдена</p>
      <NuxtLink 
      :to="`/${currentLocale}`"
      class="error__link"
      >Вернуться на главную страницу
   </NuxtLink>
   </div>
</template>

<style lang="scss" scoped>
.error {
   height: 100dvh;
   display: flex;
   flex-direction: column;
   align-items: center;
   justify-content: center;
   row-gap: toEm(22, 16);

   &__title {
      font-size: toEm(32, 16);
      color: var(--danger-color);
   }

   &__descr {
      font-size: toEm(22, 16);
   }

   &__link {
      padding-inline: toEm(9, 16);
      padding-block: toEm(12, 16);
      border-radius: toRem(6);
      font-weight: 600;
      font-size: toEm(18, 16);
      color: var(--light-color);
      background-color: var(--sky-blue-color);
   }
}
</style>