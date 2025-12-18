<script setup lang="ts">
const colorMode = useColorMode()

function iconName(theme: string) {
  if (theme === 'light') return 'ph:sun-duotone'
  if (theme === 'dark') return 'ph:moon-light'
   return 'ph:coffee'
}
</script>

<template>
   <ul class="color-mode">
      <li class="color-mode__item"
      v-for="theme of ['light', 'dark', 'custom']"
      :key="theme"
      >
      <UButton
      @click="colorMode.preference = theme"
      variant="color-theme"
      :icon="iconName(theme)"
      :theme="theme"
      :aria-label="theme"
      />
      </li>
   </ul>
 </template>
 
 <style lang="scss" scoped>
 .color-mode {
   display: inline-flex;
   column-gap: toRem(4);

   @media (max-width:$mobile){
      flex-direction: column;
      row-gap: toRem(6);
   }
 }
 </style>