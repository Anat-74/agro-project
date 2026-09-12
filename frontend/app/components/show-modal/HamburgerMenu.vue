<script setup lang="ts">
import { discountProductTranslations } from "~/locales/discountProduct";

// Слайд «Меню» панели каталога: навигация сайта (из попапа), Акции,
// контакты + соцсети, Профиль (внизу).
const props = defineProps<{
  // Пункты меню из Strapi: global.header.navigation (dynamiczone layout.link)
  navigation?: NavLink[]
  socials: SocialLink[]
  phones: Phone[]
}>()

const emit = defineEmits<{
  navigate: []
}>()

const { currentLocale } = useLocale()
const route = useRoute()
const { getProductLink } = useProductLink()

const discountT = computed(
  () => discountProductTranslations[currentLocale.value],
)

// «Главная» (/) исключена — на неё ведёт логотип (как в MoreMenuPopover)
const navItems = computed(() =>
  (props.navigation ?? []).filter((item) => item.url !== "/"),
)

// Иконки по url (в Strapi поля icon нет) — как в popover/MoreMenuPopover.vue
const iconByUrl: Record<string, string> = {
  "/about": "mingcute:information-line",
  "/services": "mingcute:settings-4-line",
  "/contacts": "mingcute:mail-line",
  "/news": "ph:megaphone-light",
  "/blog": "ph:newspaper",
}
const iconFor = (url: string): string => iconByUrl[url] ?? "mingcute:right-line"

const isActive = (url: string) =>
  route.path === `/${currentLocale.value}${url}`

// Акции — общий кэш с корзиной (ShowModalCartDialog): ключ cart-discount-{locale}
const discountKey = computed(() => `cart-discount-${currentLocale.value}`)

const { data: discount } = useCachedAsyncData(
  discountKey,
  async () => {
    const { find } = useStrapi()
    const response = await find<Product>("products", {
      filters: {
        isDiscount: true,
        locale: { $eq: currentLocale.value },
      },
      pagination: { pageSize: 100 } as PaginationMeta,
      populate: {
        image: { fields: ["alternativeText", "url"] },
        subcategory: {
          fields: ["name", "slug"],
          populate: { category: { fields: ["name", "slug"] } },
        },
      },
    } as any)
    return response.data || []
  },
  { watch: [discountKey], server: false, ttl: 300_000 },
)
</script>

<template>
  <nav class="hamburger-menu-panel">
    <!-- Навигация сайта (из попапа) — строки в стиле аккордеона -->
    <ul v-if="navItems.length" class="hamburger-menu-panel__list">
      <li v-for="item in navItems" :key="item.id" class="hamburger-menu-panel__item">
        <NuxtLink
          class="hamburger-menu-panel__link accordion__summary"
          :class="{ 'hamburger-menu-panel__link_is-active': isActive(item.url) }"
          :to="`/${currentLocale}${item.url}`"
          @click="emit('navigate')"
        >
          <Icon class="hamburger-menu-panel__icon" :name="iconFor(item.url)" />
          <span class="hamburger-menu-panel__label">{{ item.label }}</span>
        </NuxtLink>
      </li>
    </ul>

    <!-- Акции — <details>, как в Категориях -->
    <UAccordion v-if="discount?.length" name="menu-faq" variant="discount">
      <template #header>
        <Icon class="accordion__discount-icon" name="mdi:discount-outline" />
        <h4 class="accordion__product-sub-title">{{ discountT.discount }}</h4>
      </template>
      <ul class="accordion__product-list">
        <li
          v-for="prod in discount"
          :key="prod.documentId"
          class="accordion__product-item"
        >
          <NuxtLink
            :class="[
              'accordion__product-link',
              'accordion__product-link_is-discount',
              { 'accordion__product-link_is-active': isActive(getProductLink(prod)) },
            ]"
            :to="getProductLink(prod)"
            @click="emit('navigate')"
          >
            <UImage
              v-if="prod.mainImage?.url || prod.image?.length"
              :src="prod.mainImage?.url || prod.image?.[0]?.url"
              alt=""
              class="accordion__product-image-link"
              width="32"
              height="32"
              type="icon"
            />
            <h4 class="accordion__product-sub-title">{{ prod.name }}</h4>
          </NuxtLink>
        </li>
      </ul>
    </UAccordion>

    <!-- Контакты + соцсети (перед Профилем) -->
    <div class="hamburger-menu-panel__contacts">
      <div
        v-for="item in phones"
        :key="item.documentId || item.id"
        class="dialog-hamburger__phones"
      >
        <Icon v-if="item.isMobile" name="et:phone" />
        <Icon v-if="!item.isMobile" name="carbon:phone-ip" />
        <a
          :href="`tel:${item.phoneNumber.replace(/[^0-9+]/g, '')}`"
          class="company__link-phones"
          >{{ formatPhone(item.phoneNumber) }}
        </a>
      </div>
      <USocials :socials="socials" />
    </div>

    <!-- Профиль (Логин-Регистрация / кабинет) — внизу -->
    <div class="hamburger-menu-panel__profile">
      <ProfileLink />
    </div>
  </nav>
</template>

<style lang="scss" scoped>
.hamburger-menu-panel {
  flex: 1 1 auto;
  display: flex;
  flex-direction: column;
  row-gap: toEm(16);

  &__list {
    display: flex;
    flex-direction: column;
    row-gap: toEm(4);
  }

  // Строка меню: берёт вид аккордеон-строки (.accordion__summary),
  // но выравнивает иконку и текст по левому краю
  &__link {
    justify-content: flex-start;
    column-gap: toEm(10);
    text-decoration: none;

    &_is-active {
      color: var(--danger-color);
      font-weight: 700;
    }
  }

  &__icon {
    font-size: toRem(22);
    color: var(--green-color);
    flex-shrink: 0;
  }

  &__label {
    text-align: left;
  }

  &__contacts {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    row-gap: toEm(8);
    margin-block-start: auto;   // прижимаем контакты/профиль к низу слайда
  }

  &__profile {
    display: flex;
    justify-content: flex-end;
  }
}
</style>
