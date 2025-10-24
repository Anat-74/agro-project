<script setup lang="ts">
const colorMode = useColorMode()

function iconName(theme: string) {
  if (theme === 'system') return 'ph:laptop'
  if (theme === 'light') return 'ph:sun-duotone'
  if (theme === 'dark') return 'ph:moon-light'
   return 'ph:coffee'
}
</script>

<template>
   <ul class="color-mode">
      <li class="color-mode__item"
      v-for="theme of ['system', 'light', 'dark', 'sepia']"
      :key="theme"
      >
      <UButton
      @click="colorMode.preference = theme"
       name-class="color-theme"
      :icon="iconName(theme)"
      :theme="theme"
      :aria-label="theme"
      />
      </li>
   </ul>
 </template>
 
 <style lang="scss" scoped>
 .color-mode {
   display: flex;
   @include adaptiveValue("column-gap", 4, 8);

   &__item {
      display: flex;
   }
 }
 </style>