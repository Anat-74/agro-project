<script lang="ts" setup>
import { VISIBILITY_KEY } from "#shared/utils/visibility";
import ContactsPopover from "~/components/popover/ContactsPopover.vue";

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
          class="nav__item"
          @mouseenter="item.url === '/contacts' ? visibleIsContacts() : null"
          @mouseleave="item.url === '/contacts' ? hideContacts() : null"
        >
          <NuxtLink
            v-if="item.url === '/contacts'"
            :class="['nav__link', 'nav__link_contacts', { 'nav__link_is-contacts': isContacts }]"
            :to="`/${currentLocale}${item.url}`"
          >{{ item.label }} <Icon name="mingcute:down-line" /></NuxtLink>
          <NuxtLink v-else class="nav__link" :to="`/${currentLocale}${item.url}`">{{ item.label }}</NuxtLink>
          <!-- Поповер контактов: hover-показ через provide/inject (isContacts из app.vue).
               DOM-потомок li — пока курсор над поповером (и его ::before-мостом),
               mouseleave на li не срабатывает и дропдаун не закрывается -->
          <ContactsPopover
            v-if="item.url === '/contacts'"
            :email="email"
            :phones="phones"
          />
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
  }

  &__link {
    position: relative;
    display: flex;
    align-items: center;
    column-gap: toRem(5);
    padding-block: toRem(3);
    color: var(--primary-color);

    &_contacts {
      anchor-name: --contacts-anchor;   // якорь для ContactsPopover (Anchor Positioning)

      svg {
        transition: rotate var(--transition-duration), color var(--transition-duration);
      }
    }

    &_is-contacts {
      svg {
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

  // Caret разворачивается, когда поповер контактов открыт
  &__item:has(.contacts-popover:popover-open) &__link_contacts svg {
    rotate: 180deg;
  }
}

.router-link-active {
  color: var(--danger-color) !important;
}
</style>
