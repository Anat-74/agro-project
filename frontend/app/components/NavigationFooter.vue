<script lang="ts" setup>
import { baseNavigationTranslations } from '~/locales/baseNavigation'
const { currentLocale } = useLocale()
</script>

<template>
   <nav
   class="nav-footer"
   aria-label="secondary navigation"
   >
   <ul class="nav-footer__list">
   <li class="nav-footer__item">
            <NuxtLink
            class="nav-footer__link"
            :to="`/${currentLocale}/about`">
            {{ baseNavigationTranslations[currentLocale].about }}
         </NuxtLink>
      </li>
      <li class="nav-footer__item">
            <NuxtLink 
            class="nav-footer__link" 
            :to="`/${currentLocale}/services`">
            {{ baseNavigationTranslations[currentLocale].services }}
         </NuxtLink>
      </li>
      <li class="nav-footer__item">
            <NuxtLink 
            class="nav-footer__link" 
            :to="`/${currentLocale}/contacts`">
            {{ baseNavigationTranslations[currentLocale].contacts }}
         </NuxtLink>
      </li>
   </ul>
   </nav>
</template>

<style lang="scss" scoped>
.nav-footer {
&__list {
   display: flex;
   flex-direction: column;
   row-gap: toEm(28);
   align-items: center;
   padding-inline: toEm(9);
   padding-block: toEm(18);
   outline: toRem(5) inset var(--bg-nav-footer-outline);
   background-color: var(--bg-nav-footer);

   @media (max-width:$mobile){
      outline-width: toRem(3);
   }
}

&__link {
   font-weight: 600;
   letter-spacing: 1.2px;
   font-family: $font-family2;
   color: var(--border-color);
   transition: color var(--transition-duration);
   @include adaptiveValue("font-size", 18, 15);

   @include hover {
      color: var(--warning-hover);
   }
}
}

.router-link-active {
   border-color: var(--active-color);
   color: var(--active-color) !important;
   pointer-events: none !important;
}

</style>