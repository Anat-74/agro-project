<script setup lang="ts">
import { buttonTranslations } from "~/locales/button";
import ShowModalArticle from "~/components/show-modal/ShowModalArticle.vue";
import ShowModalProduct from "~/components/show-modal/ShowModalProduct.vue";
import { useGardenCalculator } from "~/composables/useGardenCalculator";
import { GARDEN_SECTION, type CalcSectionConfig } from "~/utils/calcSections";
import type {
  CalcPurpose,
  GardenCrop,
  GardenProduct,
} from "~~/shared/types/garden";

// Секция-калькулятор раздела: выбор предмета → расчёт (поле ввода → значения →
// таблица) и товары выбранного предмета. Конкретный раздел, его режимы, расчёт,
// запросы, поле ввода и тексты приходят конфигурацией (см. calcSections)
interface Props {
  // Показывать блок «Частые вопросы». На странице калькулятора вопросы выводятся
  // отдельным блоком страницы (виден и на телефоне), чтобы не было дубля
  showFaq?: boolean;
  // Конфигурация раздела (по умолчанию — «Посадка»)
  section?: CalcSectionConfig<any, any, any>;
}

const props = withDefaults(defineProps<Props>(), {
  showFaq: true,
  section: () => GARDEN_SECTION,
});

const config = computed(() => props.section);

const { currentLocale } = useLocale();
const { getProductLink } = useProductLink();
const cartStore = useCartStore();

const t = computed(() => config.value.locales[currentLocale.value]);
const buttonT = computed(() => buttonTranslations[currentLocale.value]);

// ===== Предметы раздела (растения «Посадки», позже — продукты «Заготовок») =====
const itemsKey = computed(() => `${config.value.id}-items-${currentLocale.value}`);
const { data: crops, pending: pendingCrops } = useCachedAsyncData(
  itemsKey,
  async () => {
    const { find } = useStrapi();
    const response = await find<GardenCrop>(
      config.value.items.endpoint,
      config.value.items.query(currentLocale.value) as any,
    );
    return response.data || [];
  },
  { watch: [itemsKey], server: false, ttl: 600_000 },
);

// ===== Выбор растения =====
const selectedId = ref<string | null>(null);
const selectedCrop = computed(
  () => crops.value?.find((c) => c.documentId === selectedId.value) || null,
);

// По умолчанию — первое растение
watch(
  crops,
  (list) => {
    const first = list?.[0];
    if (!selectedId.value && first) selectedId.value = first.documentId;
  },
  { immediate: true },
);

// ===== Статьи блога по выбранному растению (blog ↔ crop) =====
// Клик по статье: на телефоне/планшете открываем модальное окно (страница статьи
// остаётся для десктопа и поиска); кнопку «Рассчитать посадку» внутри не показываем —
// человек уже находится в калькуляторе
const articleModalRef = useTemplateRef<InstanceType<typeof ShowModalArticle>>("article-modal");
const { activeArticle, interceptArticleClick } = useArticleModal();

const onArticleClick = (item: ArticleLinkItem, event: MouseEvent) => {
  if (!interceptArticleClick(item, event)) return;
  nextTick(() => articleModalRef.value?.openModal());
};

// Ссылка на товар: на телефоне и планшете открываем окно товара, а не переходим
// на страницу (страница остаётся для десктопа и поисковых систем, ссылка —
// настоящая, поэтому роботы по ней ходят). Модалка сама догружает товар по его
// адресу тем же ключом кэша, что и страница товара
const { width } = useViewport();
const productModalRef = useTemplateRef<InstanceType<typeof ShowModalProduct>>("product-modal");
const activeProduct = ref<GardenProduct | null>(null);

const onProductClick = (product: GardenProduct, event: MouseEvent) => {
  if (!width.value || width.value > 1024) return;
  // Перехватываем только клик по самой ссылке: кнопка «добавить в корзину»
  // стоит в той же строке и не должна открывать окно товара
  const clickedLink = (event.target as Element | null)?.closest("a");
  if (!clickedLink) return;
  // Останавливаем событие: ссылка не проверяет preventDefault и всё равно
  // выполнила бы переход — клик не должен до неё дойти
  event.stopPropagation();
  event.preventDefault();
  activeProduct.value = product;
  nextTick(() => productModalRef.value?.openModal?.());
};

const articlesKey = computed(
  () => `${config.value.id}-articles-${currentLocale.value}-${selectedId.value ?? "none"}`,
);
const { data: articles } = useCachedAsyncData(
  articlesKey,
  async () => {
    const itemId = selectedId.value;
    if (!itemId) return [];
    const { find } = useStrapi();
    const response = await find<{ documentId: string; title: string; slug: string; date?: string }>(
      config.value.articles.endpoint,
      config.value.articles.query(currentLocale.value, itemId) as any,
    );
    return response.data || [];
  },
  { watch: [articlesKey], server: false, ttl: 600_000 },
);

// ===== FAQ раздела (calculator-page.faq) =====
// Один источник для страницы калькулятора и для слайда «Посадка» (≤ $tablet)
type GardenFaqItem = { question: string; answer: string };
// Ключ кэша разный для страницы и панели: на странице вопросы не грузим (их
// выводит сама страница), иначе пустой ответ из кэша попал бы и в панель
const faqKey = computed(
  () => `garden-faq-${currentLocale.value}-${props.showFaq ? "panel" : "page"}`,
);
const { data: faqItems } = useCachedAsyncData(
  faqKey,
  async () => {
    // На странице калькулятора вопросы выводятся самой страницей — запрос не нужен
    if (!props.showFaq) return [];
    const { find } = useStrapi();
    const response = await find<{ faq?: GardenFaqItem[] }>(
      config.value.page.endpoint,
      config.value.page.query(currentLocale.value) as any,
    );
    const entry: any = Array.isArray(response.data)
      ? response.data[0]
      : response.data;
    return (entry?.faq || []) as GardenFaqItem[];
  },
  { server: false, ttl: 600_000 },
);

// ===== Товары предмета (по назначению) =====
const productsKey = computed(
  () => `${config.value.id}-products-${currentLocale.value}-${selectedId.value ?? "none"}`,
);
const { data: products, pending: pendingProducts } = useCachedAsyncData(
  productsKey,
  async () => {
    const itemId = selectedId.value;
    if (!itemId) return [];
    const { find } = useStrapi();
    const response = await find<GardenProduct>(
      config.value.products.endpoint,
      config.value.products.query(currentLocale.value, itemId) as any,
    );
    return response.data || [];
  },
  { watch: [productsKey], server: false, ttl: 300_000 },
);

// ===== Калькулятор: режим и поле ввода — всё из конфигурации раздела =====
const mode = ref<string>(config.value.modes[0]?.id ?? "");
// Значение поля храним в базовых единицах, а показываем в выбранной
const unitId = ref<string>(config.value.input.units[0]?.id ?? "");
const value = ref(1);

const unitFactor = computed(
  () => config.value.input.units.find((u) => u.id === unitId.value)?.factor ?? 1,
);

const unitTabs = computed<{ id: string; label: string }[]>(() =>
  config.value.input.units.map((u) => ({ id: u.id, label: t.value[u.labelKey] })),
);

// Подпись единицы рядом с полем (например, «соток» / «грамм»)
const unitLabel = computed(
  () => t.value[config.value.input.units.find((u) => u.id === unitId.value)?.labelKey ?? "areaUnit"],
);

// Значение для поля ввода: показываем в выбранной единице
const inputValue = computed<number>({
  get: () => value.value / unitFactor.value,
  set: (newValue) => {
    const num = Number(newValue);
    value.value = Number.isFinite(num) && num > 0 ? num * unitFactor.value : 0;
  },
});

// Расчётная логика (режимы, строки результата, пачки) — в composable, общем
// для разделов; вся специфика приходит конфигурацией
const {
  modeTabs,
  hasModeDataFor,
  resultRowsFor,
  packCountFor,
} = useGardenCalculator({
  config,
  selectedItem: selectedCrop,
  products,
  value,
  mode,
  t,
});

// Слайдер расчёта: табы = слайды. Клик по табу переключает слайд,
// свайп слайдера обновляет активный таб (как в слайдере панели)
const calcSlider = useTemplateRef("calc-slider");

const selectMode = (id: string) => {
  mode.value = id;
  const index = modeTabs.value.findIndex((tab) => tab.id === id);
  if (index >= 0) calcSlider.value?.go(index + 1);
};

const onCalcSlide = (n: number) => {
  const tab = modeTabs.value[n - 1];
  if (tab) mode.value = tab.id;
};

// Свайп по блоку расчёта: зона шире самого слайдера (табы, поле площади,
// таблица). Механику даёт USlider (nested + swipeBy) — здесь только жест
const calcSwipeX = ref<number | null>(null);
const calcSwipeY = ref<number | null>(null);

const onCalcSwipeStart = (e: TouchEvent) => {
  calcSwipeX.value = e.touches[0]?.clientX ?? null;
  calcSwipeY.value = e.touches[0]?.clientY ?? null;
};

const onCalcSwipeEnd = (e: TouchEvent) => {
  const startX = calcSwipeX.value;
  const startY = calcSwipeY.value;
  calcSwipeX.value = null;
  calcSwipeY.value = null;
  if (startX === null || startY === null) return;
  const touch = e.changedTouches[0];
  calcSlider.value?.swipeBy(
    (touch?.clientX ?? startX) - startX,
    (touch?.clientY ?? startY) - startY,
  );
};

const onCalcSwipeCancel = () => {
  calcSwipeX.value = null;
  calcSwipeY.value = null;
};

// Сколько единиц этого товара уже лежит в корзине (для состояния кнопки и счётчика)
const cartQtyFor = (documentId: string): number =>
  cartStore.items.find((item) => item.product.documentId === documentId)?.quantity ?? 0;

// «В корзину» из расчёта: добавляем сразу N пачек этого товара
const addProductToCart = (product: GardenProduct) => {
  cartStore.addToCart(
    product,
    product.category?.slug ?? "",
    product.subcategory?.slug ?? null,
    packCountFor(product),
  );
};

// Группы <details> уникальны для каждого инстанса компонента: страница и панель// живут в одном документе, а name у details склеивает их группы НА ВЕСЬ документ
// (открытие в панели закрывало бы пункт на странице)
// Группы товаров: первые GROUP_PREVIEW позиций видны сразу, остальные свёрнуты
// и раскрываются по шеврону «показать все» (решение 25.09).
// Анимация раскрытия — как у разделов аккордеона: grid-template-rows 0fr → 1fr
const GROUP_PREVIEW = 2;
const expandedGroups = ref<Set<number>>(new Set());
const toggleGroupProducts = (index: number) => {
  const next = new Set(expandedGroups.value);
  if (next.has(index)) next.delete(index);
  else next.add(index);
  expandedGroups.value = next;
};

const faqGroupId = useId();

type Purpose = CalcPurpose;
const purposeGroups = computed(() => {
  // Группы по назначениям — из конфигурации раздела (порядок, подписи, иконки)
  const groups = Object.fromEntries(
    config.value.purposes.map((item) => [item.id, [] as GardenProduct[]]),
  ) as Record<string, GardenProduct[]>;
  for (const p of products.value ?? []) {
    const purpose: Purpose = p.purpose ?? "other";
    (groups[purpose] ?? groups.other ?? []).push(p);
  }
  return config.value.purposes
    .map((item) => ({
      id: item.id,
      label: t.value[item.key],
      icon: item.icon,
      items: groups[item.id] ?? [],
    }))
    .filter((group) => group.items.length);
});
</script>

<template>
  <div class="calc-section">
    <header class="calc-section__head">
      <h2 class="calc-section__title">{{ t.title }}</h2>
      <p class="calc-section__subtitle">{{ t.subtitle }}</p>
    </header>

    <!-- Что сажаем? -->
    <section class="calc-section__section">
      <h3 class="calc-section__question">
        <Icon name="mdi:sprout-outline" class="calc-section__question-icon" />
        {{ t.question }}
      </h3>

      <!-- Растения. Данные приходят только на клиенте, поэтому во время загрузки
           показываем общий индикатор проекта (ULoader показывает себя сам) -->
      <ULoader v-show="pendingCrops" />

      <div v-if="crops?.length" class="calc-section__chips">
        <UButton
          v-for="crop in crops"
          :key="crop.documentId"
          variant="plain"
          :class="[
            'calc-section__chip',
            { 'calc-section__chip_is-active': crop.documentId === selectedId },
          ]"
          :aria-pressed="crop.documentId === selectedId"
          @click="selectedId = crop.documentId"
        >
          <UImage
            v-if="crop.image?.url"
            :src="crop.image.url"
            :alt="crop.image.alternativeText || ''"
            class="calc-section__chip-image"
            width="24"
            height="24"
            type="icon"
          />
          <span>{{ crop.name }}</span>
        </UButton>
      </div>

      <p v-else-if="!pendingCrops" class="calc-section__empty">
        {{ t.emptyCrops }}
      </p>
    </section>

    <!-- Калькулятор -->
    <section
      v-if="selectedCrop"
      class="calc-section__section calc-section__section_calc"
      @touchstart.passive="onCalcSwipeStart"
      @touchend="onCalcSwipeEnd"
      @touchcancel="onCalcSwipeCancel"
    >
      <h3 class="calc-section__question">
        <Icon name="mdi:calculator-variant-outline" class="calc-section__question-icon" />
        {{ t.calcHeading }}
      </h3>

      <div
        class="calc-section__modes"
        role="tablist"
        :aria-label="t.calcModes"
      >
        <UButton
          v-for="tab in modeTabs"
          :key="tab.id"
          variant="plain"
          role="tab"
          :class="[
            'calc-section__mode',
            { 'calc-section__mode_is-active': mode === tab.id },
          ]"
          :aria-selected="mode === tab.id"
          @click="selectMode(tab.id)"
        >
          <Icon :name="tab.icon" />
          {{ tab.label }}
        </UButton>
      </div>

      <!-- Поле ввода: подпись с иконкой слева, единицы измерения справа -->
      <div class="calc-section__units-row">
        <span class="calc-section__field-label">
          <Icon :name="config.input.icon" class="calc-section__label-icon" />
          {{ t[config.input.labelKey] }}
        </span>

        <div
          class="calc-section__units"
          role="radiogroup"
          :aria-label="t.areaUnits"
        >
          <UButton
            v-for="tab in unitTabs"
            :key="tab.id"
            variant="plain"
            role="radio"
            :class="[
              'calc-section__unit',
              { 'calc-section__unit_is-active': unitId === tab.id },
            ]"
            :aria-checked="unitId === tab.id"
            @click="unitId = tab.id"
          >
            {{ tab.label }}
          </UButton>
        </div>
      </div>

      <!-- Поле ввода значения (справа) и единица измерения -->
      <div class="calc-section__field">
        <UInput
          v-model.number="inputValue"
          type="number"
          :min="0.1"
          :step="0.1"
          clear-on-focus
          :aria-label="`${t[config.input.labelKey]}, ${unitLabel}`"
          class="calc-section__input"
        />
        <span class="calc-section__field-unit">{{ unitLabel }}</span>
      </div>

      <!-- Расчёт: слайдер по режимам — тот же паттерн, что у слайдера панели
           (USlider). Табы выше переключают слайды, внизу по центру — точки -->
      <USlider
        ref="calc-slider"
        nested
        :slides="modeTabs"
        slide-key="id"
        variant="background"
        height="auto"
        :show-navigation="false"
        class="calc-section__calc-slider"
        @update:active="onCalcSlide"
      >
        <template #default="{ slide }">
          <p v-if="!hasModeDataFor(slide.id)" class="calc-section__empty">
            {{ t.noData }}
          </p>

          <UValueTable
            v-else
            variant="plain"
            :rows="resultRowsFor(slide.id)"
            :caption="t.calcHeading"
          />
        </template>
      </USlider>
    </section>

    <!-- Товары растения -->
    <section v-if="selectedCrop" class="calc-section__section">
      <div class="calc-section__section-head">
        <h3 class="calc-section__question">
          <Icon name="mingcute:basket-line" class="calc-section__question-icon" />
          {{ t.productsTitle }}
        </h3>
        <!-- Правый слот: в панели сюда приходит кнопка корзины; на странице раздела — пусто -->
        <slot name="products-action" />
      </div>

      <div v-if="purposeGroups.length" class="calc-section__groups">
        <UAccordion
          v-for="(group, index) in purposeGroups"
          :key="group.id"
          open
        >
          <template #header>
            <span class="calc-section__group-label">
              <Icon :name="group.icon" class="calc-section__group-icon" />
              <span class="calc-section__group-title">{{ group.label }}</span>
            </span>
            <!-- Пунктирный лидер: растягивается между названием и шевроном -->
            <span class="calc-section__group-leader" aria-hidden="true" />
          </template>

          <!-- Тело группы: обёртка с overflow: hidden нужна для схлопывания -->
          <div class="calc-section__group-body">
            <ul class="calc-section__list">
              <li
                v-for="(prod, itemIndex) in group.items"
                :key="prod.documentId"
                :class="[
                  'calc-section__product-item',
                  {
                    'calc-section__product-item_extra': itemIndex >= GROUP_PREVIEW,
                    'calc-section__product-item_extra_is-open':
                      itemIndex >= GROUP_PREVIEW && expandedGroups.has(index),
                  },
                ]"
                @click.capture="onProductClick(prod, $event)"
              >
                <NuxtLink
                  class="calc-section__product accordion__summary"
                  :to="getProductLink(prod)"
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
                  <Icon
                    v-if="!(prod.mainImage?.url || prod.image?.length)"
                    name="mingcute:shopping-bag-2-line"
                    class="calc-section__product-icon"
                  />
                  <span class="calc-section__product-name">{{ prod.name }}</span>
                </NuxtLink>
                <!-- Кнопка добавления: иконка корзины, поверх неё — крупный плюс
                     с эффектом втиснения. Количество — счётчиком НАД кнопкой справа
                     (абсолютное позиционирование: кнопка не растёт, соседи не сдвигаются) -->
                <UButton
                  variant="plain"
                  :class="[
                    'calc-section__add',
                    { 'calc-section__add_in-cart': cartQtyFor(prod.documentId) > 0 },
                  ]"
                  :aria-label="
                    cartQtyFor(prod.documentId) > 0
                      ? `${buttonT.ariaLabelIncreaseQuantity}: ${prod.name}`
                      : `${buttonT.label}: ${prod.name}`
                  "
                  @click="addProductToCart(prod)"
                >
                  <Icon
                    :name="cartQtyFor(prod.documentId) > 0 ? 'mingcute:add-line' : 'cil:cart'"
                    :width="20"
                    :height="20"
                  />
                  <span
                    v-if="cartQtyFor(prod.documentId) > 0"
                    :key="cartQtyFor(prod.documentId)"
                    class="calc-section__add-count"
                  >{{ cartQtyFor(prod.documentId) }}</span>
                </UButton>
              </li>
            </ul>

            <!-- «Показать все»: только если товаров больше превью -->
            <UButton
              v-if="group.items.length > GROUP_PREVIEW"
              variant="plain"
              :class="[
                'calc-section__show-all',
                { 'calc-section__show-all_is-open': expandedGroups.has(index) },
              ]"
              :aria-label="
                expandedGroups.has(index)
                  ? buttonT.ariaLabelCollapseProducts
                  : buttonT.ariaLabelShowAllProducts
              "
              @click="toggleGroupProducts(index)"
            >
              <Icon name="mingcute:down-line" />
            </UButton>
          </div>
        </UAccordion>
      </div>

      <ULoader v-show="pendingProducts" />

      <p v-if="!pendingProducts && !purposeGroups.length" class="calc-section__empty">
        {{ t.emptyProducts }}
      </p>
    </section>

    <!-- Статьи блога по растению -->
    <section v-if="selectedCrop && articles?.length" class="calc-section__section">
      <h3 class="calc-section__question">
        <Icon name="mdi:book-open-outline" class="calc-section__question-icon" />
        {{ t.articlesTitle }}
      </h3>
      <ul class="calc-section__list">
        <!-- Клик перехватываем на li (фаза перехвата): на телефоне откроется
             модалка, на десктопе ссылка сработает как обычно -->
        <li
          v-for="article in articles"
          :key="article.documentId"
          itemscope
          itemtype="https://schema.org/Article"
          @click.capture="onArticleClick(article, $event)"
        >
          <NuxtLink
            class="calc-section__article"
            :to="`/${currentLocale}/blog/${article.slug}`"
            itemprop="url"
          >
            <Icon name="mingcute:document-line" />
            <span itemprop="headline">{{ article.title }}</span>
          </NuxtLink>
          <time
            v-if="article.date"
            class="visually-hidden"
            itemprop="datePublished"
            :datetime="article.date"
          >{{ article.date }}</time>
        </li>
      </ul>
    </section>

    <!-- Частые вопросы: тот же источник (calculator-page.faq), что и на странице -->
    <section v-if="showFaq && faqItems?.length" class="calc-section__section">
      <h3 class="calc-section__question">
        <Icon name="mingcute:question-line" class="calc-section__question-icon" />
        {{ t.faqTitle }}
      </h3>
      <UAccordion
        v-for="(item, index) in faqItems"
        :key="index"
        :name="`garden-faq-${faqGroupId}-${index}`"
      >
        <template #header>
          <h4 class="calc-section__faq-question">{{ item.question }}</h4>
        </template>
        <div class="calc-section__faq-answer">
          <div class="calc-section__faq-text">
            <MDC :value="item.answer" />
          </div>
        </div>
      </UAccordion>
    </section>

    <!-- Модальные окна (в конце разметки, чтобы не разрывать соседство секций,
         от которого зависит разделитель между блоками) -->
    <ShowModalArticle
      ref="article-modal"
      :slug="activeArticle?.slug"
      :title="activeArticle?.title"
      :date="activeArticle?.date"
      :show-calculator="false"
    />

    <ShowModalProduct
      ref="product-modal"
      :product="activeProduct"
      hide-trigger
    />
  </div>
</template>

<style lang="scss" scoped>
.calc-section {
  display: flex;
  flex-direction: column;
  row-gap: toEm(16);
  // Ширина строго по слайду панели: без этого карточка считается по
  // содержимому (слайдер расчёта распирал её до ~510px)
  width: 100%;
  min-width: 0;
  min-height: 100%;
  // Светлая подложка: на размытом фоне панели зелёные подписи и текст читались плохо
  padding: toEm(12);
  border-radius: toRem(12);
  background-color: rgba(255, 255, 255, 0.72);

  // Шапка слайда: заголовок + подзаголовок
  &__head {
    display: flex;
    flex-direction: column;
    row-gap: toEm(2);
    // Отдельной линии над «Что сажаем?» нет: верх блока даёт общая рамка группы
  }

  &__title {
    font-size: toEm(22);
    font-weight: 700;
    color: var(--primary-color);
  }

  &__subtitle {
    font-size: toEm(15);
    color: var(--gray-color);
  }

  // Блоки — каждый в рамке-«канавке» (эталон: рамка langSwitcher): 1px рамка,
  // скругление 4px и светлый блик по внутреннему верхнему краю
  &__section {
    display: flex;
    flex-direction: column;
    row-gap: toEm(8);
    // Сверху на 3px меньше (7 вместо 10)
    padding: toEm(7) toEm(10) toEm(10);
    border: toRem(1) solid rgba(0, 0, 0, 0.25);
    border-radius: toRem(4);
    box-shadow: inset 0 toRem(1) 0 rgba(255, 255, 255, 0.4);
  }

  // Секция расчёта: горизонтальный свайп обрабатываем сами, вертикальный
  // отдаём прокрутке контента (иначе панель листается на «Меню»)
  &__section_calc {
    touch-action: pan-y;
  }

  // «Что сажаем?» + «Калькулятор расчёта» — один визуальный блок: общая рамка,
  // между секциями — пунктирный разделитель (низ и нижние углы замыкает
  // секция расчёта, поэтому у верхней части низа нет)
  &__section:first-of-type {
    border-bottom: none;
    border-radius: toRem(4) toRem(4) 0 0;
    // Низ = верху секции расчёта (15px), иначе блок «Что сажаем?» жмётся к пунктиру
    padding-block-end: toEm(15);
  }

  // Растение не выбрано — секции расчёта нет, рамка «Что сажаем?» замыкается
  &__section:first-of-type:not(:has(+ .calc-section__section_calc)) {
    border-bottom: toRem(1) solid rgba(0, 0, 0, 0.25);
    border-radius: toRem(4);
  }

  // Секция расчёта прижата к верхней части группы (margin гасит row-gap
  // карточки), сверху — пунктирный разделитель шириной 90% по центру
  &__section:first-of-type + &__section_calc {
    position: relative;
    margin-block-start: calc(-1 * toEm(16));
    // Верхнюю границу рисует пунктирный ::before, а не рамка секции
    border-top: none;
    border-radius: 0 0 toRem(4) toRem(4);
    // Отступ до пунктира увеличен на 8px (7 + 8) — блоки не «слипаются»
    padding-block-start: toEm(15);

    &::before {
      content: "";
      position: absolute;
      inset-block-start: 0;
      // Не до самых краёв блока — 90% ширины по центру
      inset-inline: 5%;
      border-block-start: toRem(1) dashed rgba(0, 0, 0, 0.25);
    }
  }

  &__question {
    display: flex;
    align-items: center;
    column-gap: toEm(6);
    font-size: toEm(18);
    font-weight: 600;
    color: var(--primary-color);
  }

  // Строка заголовка блока: заголовок слева, действие справа (в панели — кнопка
  // корзины). Правое выравнивание — на одну вертикаль с шевронами групп
  &__section-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    column-gap: toEm(10);
  }

  // Иконка перед заголовком раздела. overflow: visible + display: block —
  // иначе svg режет артворк по краям (было заметно сверху)
  &__question-icon {
    flex-shrink: 0;
    display: block;
    overflow: visible;
    font-size: toRem(20);
  }

  // Растения — чипы
  &__chips {
    display: flex;
    flex-wrap: wrap;
    gap: toEm(8);
  }

  &__chip {
    display: inline-flex;
    align-items: center;
    column-gap: toEm(6);
    padding: toEm(6) toEm(12);
    border: toRem(1) solid var(--border-color);
    border-radius: toRem(20);
    background-color: var(--light-color);
    color: var(--color);
    font-weight: 600;
    transition:
      color var(--transition-duration),
      border-color var(--transition-duration),
      background-color var(--transition-duration);

    &_is-active {
      color: var(--light-color);
      background-color: var(--green-color);
      border-color: var(--green-color);
    }

    @include hover {
      border-color: var(--green-color);
    }
  }

  // Изображение растения в чипе (круглое)
  &__chip-image {
    flex-shrink: 0;

    :deep(img) {
      width: toRem(24);
      height: toRem(24);
      border-radius: 50%;
    }
  }

  // Режимы расчёта (семена / рассада / удобрение)
  &__modes {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: toEm(4);
    padding: toEm(4);
    border-radius: toRem(10);
    background-color: var(--light-color-transparent);
  }

  &__mode {
    // Делитель 14 — собственный шрифт кнопки (ниже font-size)
    padding: toEm(6, 14) toEm(8, 14);
    border-radius: toRem(8);
    background-color: transparent;
    color: var(--gray-color);
    font-size: toEm(14);
    font-weight: 600;
    transition:
      color var(--transition-duration),
      background-color var(--transition-duration);

    &_is-active {
      color: var(--light-color);
      background-color: var(--green-color);
    }

    @include hover {
      color: var(--primary-color);
    }
  }

  // Площадь
  // Площадь: подпись с иконкой слева, единицы измерения справа
  &__units-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    column-gap: toEm(10);
  }

  &__units {
    display: flex;
    justify-content: flex-end;
    column-gap: toEm(6);
  }

  &__unit {
    padding: toEm(4) toEm(10);
    // Тонкая рамка — чтобы неактивный таб читался как кнопка на размытом фоне.
    // Рамку даём обеим кнопкам, чтобы размеры совпадали
    border: toRem(1) solid var(--border-color);
    border-radius: toRem(8);
    background-color: var(--light-color-transparent);
    color: var(--gray-color);
    // +2px к прежнему размеру: было toEm(13) ≈ 11.45px → стало 13.45px
    // (делитель — фактический шрифт родителя: 14.1px). Верхний регистр снят:
    // «М²» и «Сотки» заданы значениями в локалях (текст как в макете, не через CSS)
    font-size: toEm(13.45, 14.1);
    font-weight: 600;
    transition:
      color var(--transition-duration),
      border-color var(--transition-duration),
      background-color var(--transition-duration);

    &_is-active {
      border-color: var(--green-color);
      color: var(--light-color);
      background-color: var(--green-color);
    }

    @include hover {
      color: var(--primary-color);
    }
  }

  // Поле площади: справа (подпись — в строке с единицами выше)
  &__field {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    column-gap: toEm(8);
  }

  &__field-label {
    display: inline-flex;
    align-items: center;
    column-gap: toEm(6);
    font-weight: 600;
    color: var(--color);
  }

  // Иконка перед подписью «Площадь»
  &__label-icon {
    flex-shrink: 0;
    font-size: toRem(18);
    color: var(--primary-color);
  }

  &__input {
    // На 20% уже прежней ширины (было 120px) — значения всё равно короткие
    flex: 0 1 toRem(96);
    min-width: 0;

    // Компактнее базового поля, число — по правому краю
    :deep(.u-input__field) {
      padding-block: toEm(7);
      font-size: toEm(16);
      text-align: right;
    }
  }

  &__field-unit {
    color: var(--gray-color);
  }

  // Слайдер расчёта: слайды по режимам — тот же паттерн, что у слайдера панели
  // (USlider, вариант background). Внизу — только точки, без подложки
  // Слайдер расчёта: слайды по режимам (USlider, вариант background).
  // Внизу — только точки, без подложки
  &__calc-slider {
    // Отключение нативного скролла, snap и column-gap даёт USlider в режиме
    // nested — здесь только оформление пагинации

    // Пагинация: точки в правом углу (остальное — из базы USlider)
    :deep(.slider__pagination) {
      justify-content: flex-end;
      column-gap: toRem(8);
    }

    // Точки видимы на светлой карточке: неактивные серые, активная — зелёная
    :deep(.slider__pagination-dot) {
      width: toRem(7);
      height: toRem(7);
      border: none;
      outline: none;
      background-color: var(--gray-color);
      opacity: 0.35;
      transition:
        opacity var(--transition-duration),
        background-color var(--transition-duration);
    }

    :deep(.slider__pagination-dot_active) {
      opacity: 1;
      background-color: var(--primary-color);
    }
  }

  // Товары: группы — аккордеоны проекта (UAccordion). Промежуток даёт сам
  // аккордеон (padding-block у .accordion__details), поэтому контейнер без
  // flex-gap: иначе details и его content получили бы лишний зазор
  &__groups {
    display: block;

    // Нейтрализуем глобальные стили summary аккордеона (фон/паддинги/оутлайн) —
    // сохраняем текущий вид группы. Цвет при раскрытии не меняем на danger
    :deep(.accordion__summary) {
      padding: 0;
      background: none;
      outline: none;
    }

    :deep(.accordion__details[open] > .accordion__summary) {
      color: var(--gray-color);
    }

    :deep(.accordion__details) {
      padding-block: toRem(3);
    }
  }

  // Подпись группы: иконка + название (шрифт summary — 22px, делитель явный)
  &__group-label {
    display: flex;
    align-items: center;
    column-gap: toEm(6, 22);
  }

  &__group-title {
    font-size: toEm(15, 22);
    font-weight: 600;
    color: var(--gray-color);
  }

  // Пунктирный лидер: тянется между названием и штатным шевроном аккордеона,
  // по вертикальному центру строки (высота 0 + граница = линия по центру)
  &__group-leader {
    flex: 1;
    height: 0;
    align-self: center;
    margin-inline: toEm(8, 22);
    border-bottom: toRem(1) dashed var(--border-color);
  }

  // Иконка перед названием группы (семена / рассада / удобрения)
  &__group-icon {
    flex-shrink: 0;
    font-size: toRem(18);
    color: var(--gray-color);
  }

  // Тело группы — обязательный overflow: hidden для схлопывания аккордеона
  &__group-body {
    overflow: hidden;
    // Тот же отступ «подзаголовок → товары», что был до перевода в аккордеон
    padding-block-start: toRem(1.3);
  }

  // «Показать все»: по центру под списком, шеврон переворачивается при раскрытии.
  // Цвет — как у названий товаров (та же переменная); сам шеврон наследует цвет
  // кнопки через currentColor, вторую переменную не заводим
  &__show-all {
    display: flex;
    align-items: center;
    justify-content: center;
    // Круглая кнопка вокруг шеврона: закругление 50%, размер по иконке.
    // Без рамки и блика — только светлый фон
    width: toRem(32);
    height: toRem(32);
    margin-inline: auto;   // по центру под списком
    padding: 0;
    min-height: 0;         // сброс паддингов/min-height UButton, иначе не круг
    border: none;
    border-radius: 50%;
    background-color: var(--light-color-transparent);
    // Единственный источник цвета — кнопка (как у названий товаров)
    color: var(--warning-color);

    :deep(svg) {
      // Шеврон наследует цвет кнопки через currentColor — второй переменной нет
      color: currentColor;
      font-size: toRem(20);
      transition: rotate var(--transition-duration);
    }

    &_is-open :deep(svg) {
      rotate: -180deg;
    }

    @include hover {
      color: var(--warning-hover);
    }
  }

  &__list {
    display: flex;
    flex-direction: column;
    row-gap: toEm(4);
  }

  // Товар: подложка (ссылка) — по ширине контента, кнопка — у правого края.
  // Grid (а не flex) — потому что доп. товары схлопываются через
  // grid-template-rows 0fr → 1fr, как разделы аккордеона
  &__product-item {
    display: grid;
    grid-template-columns: 1fr auto;
    align-items: center;
    column-gap: toEm(8);
    padding-block: toEm(6);
    padding-inline-end: toEm(8);

    // Ссылка — по своему контенту (как было во flex), иначе её внутренний
    // space-between разнёс бы картинку и название по краям колонки
    .calc-section__product {
      justify-self: start;
    }
  }

  // Доп. товары (за превью): в свёрнутом виде занимают ноль и раскрываются
  // с той же длительностью, что и содержимое аккордеона (0.3s).
  // Механизм — max-height (grid-template-rows не схлопывался: содержимое с
  // фиксированными высотами — картинка 32px, кнопка 36px — не давало строке сжаться)
  &__product-item_extra {
    max-height: 0;
    padding-block: 0;
    margin-block-start: calc(-1 * #{toEm(4)});
    overflow: hidden;
    transition:
      max-height 0.3s,
      padding-block-start 0.3s,
      padding-block-end 0.3s,
      margin-block-start 0.3s;

    &_is-open {
      max-height: toRem(120);   // с запасом на длинное название в одну-две строки
      padding-block: toEm(6);
      margin-block-start: 0;
    }
  }

  // Кнопка добавления: иконка корзины, а когда товар уже в корзине — плюс
  // (плюс подсказывает, что повторное нажатие добавит ещё)
  &__add {
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: toRem(36);
    height: toRem(36);
    border: toRem(1) solid var(--border-color);
    border-radius: toRem(10);
    background-color: var(--light-color);
    color: var(--success-color);
    // Иконка корзины меньше — над ней помещается плюс (без наложения)
    font-size: toRem(16);
    transition:
      color var(--transition-duration),
      border-color var(--transition-duration);

    // Товар уже в корзине — заметная рамка
    &_in-cart {
      border-color: var(--success-color);
    }

    @include hover {
      color: var(--warning-hover);
    }
  }

  // Счётчик — как у кнопки корзины: в правом верхнем углу, вплотную к иконке
  &__add-count {
    position: absolute;
    top: toRem(-4);
    right: toRem(-4);
    min-width: toRem(18);
    padding-inline: toRem(4);
    border-radius: toRem(9);
    background-color: var(--danger-color);
    color: var(--light-color);
    font-size: toRem(11);
    font-weight: 700;
    line-height: toRem(18);
    text-align: center;
    pointer-events: none;
    // Ключ меняется вместе с количеством — анимация проигрывается заново
    animation: gardenCountPop 0.25s ease;
  }

  // Ссылка на товар: оутлайн — только у «details» (аккордеон), здесь не нужен.
  // Фон аккордеона (--light-color-transparent) тоже убираем: у товара только текст
  &__product {
    outline: none;
    background-color: transparent;
  }

  // Частые вопросы (тот же аккордеон, что в каталоге и меню)
  &__faq-question {
    // Родитель — аккордеон проекта со шрифтом 22px, поэтому делитель указываем
    // явно: без него toEm(16) дал бы 22px (em считается от родителя)
    font-size: toEm(16, 22);
    font-weight: 600;
    text-align: left;
  }

  &__faq-answer {
    // ОБЯЗАТЕЛЬНО: контент аккордеона — сосед <details>, схлопывание
    // (grid-template-rows: 0fr) работает только если у ребёнка overflow: hidden,
    // иначе ответ виден всегда и раскрытие «не работает» (как в каталоге:
    // .accordion__product-list)
    overflow: hidden;
  }

  // Отступы — на самом ответе, а не на обёртке: паддинг обёртки не схлопывается
  // и у закрытого вопроса оставалась бы видимая полоса
  &__faq-text {
    padding: toEm(8) toEm(4);
  }

  &__product {
    justify-content: flex-start;
    column-gap: toEm(8);
    text-decoration: none;

    // Подсказка, что по товару можно кликнуть (на телефоне откроется окно товара):
    // при наведении подчёркивание становится ярче, а текст — цвета warning-hover
    @include hover {
      .calc-section__product-name {
        color: var(--warning-hover);
        text-decoration-color: currentColor;
      }
    }
  }

  // Иконка товара (фолбэк, когда у товара нет изображения из CMS)
  &__product-icon {
    flex-shrink: 0;
    font-size: toRem(18);
    color: var(--warning-hover);
  }

  &__product-name {
    text-align: left;
    // Ещё на 2px меньше (было 20px → 18px)
    font-size: toEm(18, 22);
    // Цвет товара — warning (акцент), на ховере — warning-hover
    color: var(--warning-color);
    // Постоянное, но неброское подчёркивание — признак кликабельности
    text-decoration: underline;
    text-decoration-color: rgba(0, 0, 0, 0.25);
    text-underline-offset: toRem(3);
    transition:
      color var(--transition-duration),
      text-decoration-color var(--transition-duration);
  }

  // Ссылка на статью по растению
  &__article {
    display: flex;
    align-items: center;
    column-gap: toEm(6);
    padding-block: toEm(2);
    color: var(--color);
    text-decoration: none;

    @include hover {
      color: var(--green-color);
      text-decoration: underline;
    }
  }

  &__empty {
    color: var(--gray-color);
    font-style: italic;
    @include adaptiveValue("font-size", 14, 12);
  }
}

// Короткая подсветка счётчика при добавлении: видно, что количество выросло
@keyframes gardenCountPop {
  0% {
    scale: 1;
  }

  50% {
    scale: 1.3;
  }

  100% {
    scale: 1;
  }
}
</style>
