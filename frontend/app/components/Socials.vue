<script setup lang="ts">
interface Props {
  socials: SocialLink[];
}

defineProps<Props>();

// Получаем isOpen из глобального состояния
const { isOpen } = useDialog("hamburgerDialog");
</script>

<template>
  <div v-if="socials" :class="['socials', { 'socials_is-open': isOpen }]">
     <a v-for="link in socials" :key="link.documentId || link.id" :href="link.href" target="_blank">
      <UImage
        v-if="link?.icon"
        :src="link.icon[0]?.url"
        :alt="link.label"
        :smooth-load="false"
        width="26"
        height="26"
      />
    </a>
  </div>
</template>

<style lang="scss" scoped>
.socials {
  display: flex;
  column-gap: toEm(12);

  &_is-open {
    align-self: end;
    flex-direction: column;
    row-gap: toRem(8);
  }
}
</style>
