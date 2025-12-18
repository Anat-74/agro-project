<script setup lang="ts">
import type { SocialLink } from "../types/types";

interface Props {
   socials: SocialLink[]
  isOpen: boolean
}

defineProps<Props>()

const config = useRuntimeConfig();
</script>

<template>
  <div class="socials" v-if="socials"
           :class="[
        'socials',
        { 'socials_is-open': isOpen },
      ]"
  >
    <a 
    v-for="link in socials" 
    :key="link.id" 
    :href="link.href" 
    target="_blank"
    >
      <NuxtImg
        v-if="link.icon"
        :src="`${config.public.strapi.url}${link.icon[0]?.url}`"
        :alt="link.label"
        width="26"
        height="26"
      />
    </a>
  </div>
</template>

<style lang="scss" scoped>
.socials {
  align-self: end;
  display: flex;
  column-gap: toEm(12);

  img {
    transition: scale var(--transition-duration);

    &_is-open {
      flex-direction: column;
    }

    @include hover {
      scale: 1.1;
    }
  }
}
</style>
