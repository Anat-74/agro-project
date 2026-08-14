<script lang="ts" setup>
import { VISIBILITY_KEY } from "#shared/utils/visibility";

const { isContacts, visibleIsContacts, hideContacts } =
  inject<VisibilityState>(VISIBILITY_KEY)!;
const { currentLocale } = useLocale();

interface NavItem {
  id: string;
  label: string;
  url: string;
}

defineProps<{
  email: Email[];
  phones: Phone[];
  navigation?: NavItem[];
}>();
</script>

<template>
  <nav class="nav" aria-label="primary navigation">
    <ul class="nav__list">
      <template v-if="navigation?.length">
        <li
v-for="item in navigation" 
        :key="item.id" 
        :class="['nav__item', { nav__item_contacts: item.url === '/contacts' && isContacts }]" 
        @mouseenter="item.url === '/contacts' ? visibleIsContacts() : null" 
        @mouseleave="item.url === '/contacts' ? hideContacts() : null">
          <template v-if="item.url === '/contacts'">
            <NuxtLink
              :class="['nav__link', { 'nav__link_is-contacts': isContacts }]"
              :to="`/${currentLocale}${item.url}`"
              @mouseenter="visibleIsContacts"
              @mouseleave="hideContacts"
            >{{ item.label }} <Icon name="mingcute:down-line" /></NuxtLink>
            <div v-if="isContacts" class="nav__contacts contacts">
              <div v-for="phone in phones" :key="phone.documentId || phone.id" class="contacts__phone-link contacts-link">
                <Icon v-if="phone.isMobile" name="et:phone" />
                <Icon v-if="!phone.isMobile" name="carbon:phone-ip" />
                <a :href="`tel:${phone.phoneNumber.replace(/[^0-9+]/g, '')}`">{{ formatPhone(phone.phoneNumber) }}</a>
              </div>
              <div v-for="mail in email" :key="mail.documentId || mail.id" class="contacts__mail-link contacts-link">
                <Icon v-if="mail.isEmail" name="material-symbols:mail-outline" />
                <a v-if="mail.isEmail" :href="`mailto:${mail.email}`">{{ mail.email }}</a>
              </div>
            </div>
          </template>
          <NuxtLink v-else class="nav__link" :to="`/${currentLocale}${item.url}`">{{ item.label }}</NuxtLink>
        </li>
      </template>
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
    @include adaptiveValue("column-gap", 36, 22);
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
      padding-block-end: toRem(60);
      margin-block-end: toRem(-60);

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

    &_is-contacts {
      svg {
        transition: color var(--transition-duration);
        color: var(--warning-color);
      }
    }

    &:not(.router-link-active) {
      @include hover {
        &::after {
          width: 100%;
        }
      }
    }

    &::before {
      content: "";
      position: absolute;
      top: 0;
      right: toRem(-20);
      width: toRem(7);
      height: 100%;
      border-radius: toRem(25);
      background-color: var(--bg);
    }

    &::after {
      content: "";
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
  @media (min-width: $tablet) {
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
    z-index: 9999;
    top: calc(100% + toRem(32));
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

  @media (max-width: $tablet) {
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
  border: 2px solid currentColor;

  svg {
    font-size: toRem(18);
  }

  @include hover {
    color: var(--light-color);
    border-color: var(--success-color);
    background-color: var(--danger-color);
    transition: background-color var(--transition-duration);
  }
}

.router-link-active {
  color: var(--danger-color) !important;
}
</style>
