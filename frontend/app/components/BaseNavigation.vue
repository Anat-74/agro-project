<script lang="ts" setup>
import type { Email, Phone } from "../types/types"
import { baseNavigationTranslations } from '~/locales/baseNavigation'

const { isContacts, visibleIsContacts } = useVisibilityConsumer()
const { formatPhone } = useFormatPhone()
const { currentLocale } = useLocale()

defineProps<{
   email: Email[]
   phones: Phone[]
}>()
</script>

<template>
   <nav 
   class="nav"
   aria-label="primary navigation"
   >
      <ul class="nav__list">
         <li class="nav__item">
            <NuxtLink :to="`/${currentLocale}`" 
            class="nav__link">
            {{ baseNavigationTranslations[currentLocale].home }}
         </NuxtLink>
      </li>
      <li class="nav__item">
            <NuxtLink
            class="nav__link"
            :to="`/${currentLocale}/about`">
            {{ baseNavigationTranslations[currentLocale].about }}
         </NuxtLink>
      </li>
      <li class="nav__item">
            <NuxtLink 
            class="nav__link" 
            :to="`/${currentLocale}/services`">
            {{ baseNavigationTranslations[currentLocale].services }}
         </NuxtLink>
      </li>

         <li class="nav__item">
            <NuxtLink 
            class="nav__link" 
            :to="`/${currentLocale}/blog`">
            {{ baseNavigationTranslations[currentLocale].blog }}
         </NuxtLink>
      </li>

      <li :class="['nav__item', {nav__item_contacts: isContacts}]"
      @mouseenter="visibleIsContacts"
      @mouseleave="isContacts = false"
      >
            <NuxtLink 
            class="nav__link" 
            :to="`/${currentLocale}/contacts`"
            ><Icon name="material-symbols:send-to-mobile-outline-rounded" />
            {{ baseNavigationTranslations[currentLocale].contacts }}
            </NuxtLink>
            <div
            v-if="isContacts"
            class="nav__contacts contacts">
         <div
      class="contacts__phone-link contacts-link"
      v-for="item in phones" 
      :key="item.id"
      >
         <Icon
          v-if="item.isMobile"
         name="et:phone"
         />

         <Icon
          v-if="!item.isMobile"
         name="carbon:phone-ip"
         />
    <a
    :href="`tel:${item.phoneNumber.replace(/[^0-9+]/g, '')}`"
    >{{ formatPhone(item.phoneNumber) }}
    </a>
   </div>
   <div 
      class="contacts__mail-link contacts-link"
      v-for="item in email" 
     :key="item.id"
   >
      <Icon
       v-if="item.isEmail"
         name="material-symbols:mail-outline"
         />
    <a
     v-if="item.isEmail"
      :href="`mailto:${item.email}`"
    >
    {{ item.email }}
    </a>
   </div>
         </div>
      </li>
      </ul>
   </nav>
</template>

<style lang="scss" scoped>
   .nav {
      &__list {
         font-size: toEm(20);
         padding-inline-end: toEm(16);
         display: flex;
         align-items: center;
         @include adaptiveValue("column-gap", 36, 25);
      }

      &__item {
         display: flex;
         align-items: center;
         column-gap: toRem(4);
         font-weight: 500;

         .iconify--material-symbols {
            font-size: toRem(20);
         }

         &_contacts {
         position: relative;
         padding-inline: toRem(16);
         margin-inline: toRem(-16);
         padding-block-end: toRem(56);
         margin-block-end: toRem(-56);

         svg {
            transition: color var(--transition-duration);
         }
      }
   }

   &__link {
      position: relative;
      display: flex;
      align-items: center;
      column-gap: toRem(5);
      padding-block: toRem(3);
      color: var(--primary-color);

      &:not(.router-link-active) {
         @include hover {
         &::after {
            width: 100%;
         }
      }
   }
         &::before {
            content: '';
            position: absolute;
            top: 0;
            right: toRem(-20);
            width: toRem(7);
            height: 100%;
            border-radius: toRem(25);
            background-color: var(--bg);
      }

      &::after {
         content: '';
         position: absolute;
         top: 100%;
         left: 50%;
         translate: -50%;
         width: 0;
         height: toRem(2);
         background-color: currentColor;
         transition: width var(--transition-duration);
      }
   }
}

   .contacts {
   @media (min-width:$tablet){
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      row-gap: toEm(8);
      padding-inline: toRem(12);
      padding-block-start: toRem(12);
      padding-block-end: toRem(6);
      white-space: nowrap;
      position: absolute;
      z-index: 999;
      top: calc(100% + toRem(22));
      right: 0;
      translate: 0 -50%;
      border-radius: toRem(4);
      color: var(--color);
      background-color: var(--secondary-color);

      &__phone-link {
         .iconify--carbon {
            color: var(--dark-color);
         }
   }

      &__viber-link {
         svg {
            color: var(--bg-footer);
         }
      }

   &__mail-link {
      svg {
         color: var(--sky-blue);
      }
   }
}

@media (max-width:$tablet){
   display: none;
}
}
.contacts-link {
   width: toRem(236);
   display: grid;
   grid-template-columns: auto 1fr;
   align-items: center;
   justify-items: end;
   column-gap: toRem(9);
   padding-inline: toRem(9);
   padding-block: toRem(1);
   border-radius: toRem(4);
   font-size: toRem(18);
   font-weight: 500;

   &:not(:last-child) {
      border: 2px solid currentColor;
   }

      svg {
         font-size: toRem(18);
      }

      @include hover {
         color: var(--light-color);
         border-color:var(--gold-color);
         background-color: var(--danger-color);
         transition: background-color var(--transition-duration);
      }
}

.router-link-active {
   color: var(--danger-color) !important;
   pointer-events: none !important;
}
</style>