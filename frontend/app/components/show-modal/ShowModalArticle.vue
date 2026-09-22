<script setup lang="ts">
import { gardenTranslations } from "~/locales/garden";
import { buttonTranslations } from "~/locales/button";

// Модальное окно статьи блога — мобильный сценарий: вместо перехода на страницу
// статьи показываем текст прямо в диалоге. Страница остаётся «домом» контента
// (поиск, десктоп, прямые ссылки), а модалка и страница делят один ключ кэша
// (blog-{slug}-{locale}) — поэтому нет ни двойных запросов, ни расхождений.
// Данные грузятся только в браузере и по требованию, поэтому в серверной
// разметке текста модалки нет (дубля для поисковых систем не появляется).
interface Props {
  // Слаг статьи — по нему догружаем текст
  slug?: string | null;
  // Заголовок и дата из списка: показываем сразу, пока грузится текст
  title?: string | null;
  date?: string | null;
  // Показывать кнопку «Рассчитать посадку»: из панели «Посадка» она не нужна
  // (человек уже внутри калькулятора), из блога и страницы раздела — нужна
  showCalculator?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  slug: null,
  title: null,
  date: null,
  showCalculator: true,
});

const { currentLocale } = useLocale();
const { find } = useStrapi();
const t = computed(() => gardenTranslations[currentLocale.value]);
const buttonT = computed(() => buttonTranslations[currentLocale.value]);

// «Рассчитать посадку»: на телефоне открываем панель каталога на вкладке
// «Посадка» (без переходов), на десктопе — идём на страницу раздела
const { width } = useViewport();
const { requestOpen } = useGardenDialog();

const dialogId = "article-" + useId();
const dialogElement = useTemplateRef<HTMLDialogElement>("article-dialog");
const { open, close, isOpen } = useDialog(dialogId, dialogElement, {
  useShowMethod: false,
});

interface ArticleDetails {
  title?: string;
  date?: string | null;
  author?: string | null;
  content?: string | null;
}

const detailsKey = computed(
  () => `blog-${props.slug ?? "preview"}-${currentLocale.value ?? "ru"}`,
);

const {
  data: details,
  status,
  execute,
} = useCachedAsyncData(
  detailsKey,
  async () => {
    if (!props.slug) return null;
    const response = await find<ArticleDetails>("blogs", {
      filters: {
        slug: { $eq: props.slug },
        locale: { $eq: currentLocale.value },
      },
      fields: ["title", "date", "author", "content"],
    } as any);
    return (response.data?.[0] || null) as ArticleDetails | null;
  },
  { immediate: false, server: false, ttl: 300_000 },
);

const articleTitle = computed(() => details.value?.title || props.title || "");
const articleDate = computed(() => details.value?.date || props.date || null);

// Открытие — только программное (клик по статье перехватываем в списке)
const openModal = () => {
  execute();
  open();
};

const onCalculatorClick = () => {
  close();
  if (width.value && width.value <= 1024) {
    requestOpen();
    return;
  }
  navigateTo(`/${currentLocale.value}/posadka-i-urozhay`);
};

defineExpose({ openModal, close, isOpen });
</script>

<template>
  <!-- Диалог смонтирован всегда: кнопки-триггера нет, открывается через ref -->
  <dialog ref="article-dialog" class="article-modal">
    <!-- Крестик: общий компонент кнопки (вид задан в UButton, здесь только позиция) -->
    <UButton
      variant="close-modal"
      icon="mingcute:close-line"
      class="article-modal__close"
      :aria-label="buttonT.ariaLabelDialogClosed"
      @click="close"
    />

    <!-- Загрузка — общий индикатор проекта (ULoader показывает себя сам) -->
    <ULoader v-show="status === 'pending'" />

    <div v-if="status === 'error'" class="article-modal__error">
      <p>{{ t.articlesLoadError }}</p>
      <UButton variant="plain" class="article-modal__retry" @click="() => execute()">
        {{ t.articlesRetry }}
      </UButton>
    </div>

    <article v-else-if="status !== 'pending'" class="article-modal__body">
      <header class="article-modal__header">
        <h2 class="article-modal__title">{{ articleTitle }}</h2>
        <div class="article-modal__meta">
          <time
            v-if="articleDate"
            class="article-modal__date"
            :datetime="articleDate"
          >{{ articleDate }}</time>
          <span v-if="details?.author" class="article-modal__author">
            {{ details.author }}
          </span>
        </div>
      </header>

      <div v-if="details?.content" class="article-modal__content">
        <MDC :value="details.content" />
      </div>

      <!-- Из панели «Посадка» кнопка не нужна: человек и так в калькуляторе -->
      <UButton
        v-if="showCalculator"
        variant="plain"
        class="article-modal__calc"
        @click="onCalculatorClick"
      >
        <Icon name="cil:calculator" />
        {{ t.calculatorCta }}
      </UButton>
    </article>
  </dialog>
</template>

<style lang="scss" scoped>
// Диалог — по паттерну проекта (как модалка товара): нативный <dialog> сам
// центрирует (top-layer + margin: auto), без position/z-index — только размеры,
// скрытие переполнения и анимация входа
.article-modal {
  width: min(92vw, toRem(760));
  max-height: min(90vh, toRem(760));
  border-radius: toRem(20);
  background: var(--light-color);
  box-shadow: 0 toRem(24) toRem(80) rgba(0, 0, 0, 0.3);
  overflow: hidden;

  scale: 0.96;
  opacity: 0;
  transition:
    scale var(--transition-duration),
    opacity var(--transition-duration),
    overlay var(--transition-duration) allow-discrete,
    display var(--transition-duration) allow-discrete;

  &[open] {
    scale: 1;
    opacity: 1;
  }

  @starting-style {
    &[open] {
      scale: 0.96;
      opacity: 0;
    }
  }

  &::backdrop {
    background: rgba(0, 0, 0, 0.5);
    opacity: 0;
    transition:
      opacity var(--transition-duration),
      overlay var(--transition-duration) allow-discrete,
      display var(--transition-duration) allow-discrete;
  }

  &[open]::backdrop {
    opacity: 1;
  }

  @starting-style {
    &[open]::backdrop {
      opacity: 0;
    }
  }

  &__close {
    // Только позиция: вид кнопки задаёт variant="close-modal" в UButton
    position: absolute;
    top: toRem(14);
    right: toRem(14);
    z-index: 2;
  }

  &__body {
    display: flex;
    flex-direction: column;
    row-gap: toEm(14);
    max-height: inherit;
    padding: toEm(28) toEm(24);
    overflow-y: auto;
  }

  &__title {
    // toRem: у заголовка свой крупный шрифт, em считался бы от него
    padding-inline-end: toRem(32);
  }

  &__meta {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    // Делитель 14 — собственный шрифт блока (ниже font-size)
    column-gap: toEm(10, 14);
    color: var(--gray-color);
    font-size: toEm(14);
  }

  &__content {
    color: var(--color);
  }

  // Кнопка «Рассчитать посадку»: на телефоне открывает панель с калькулятором
  &__calc {
    display: inline-flex;
    align-items: center;
    align-self: flex-start;
    column-gap: toEm(8);
    padding: toEm(10) toEm(18);
    border-radius: toRem(8);
    background-color: var(--green-color);
    color: var(--light-color);
    font-weight: 600;
    transition: opacity var(--transition-duration);

    @include hover {
      opacity: 0.9;
    }
  }

  &__error {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    row-gap: toEm(10);
    padding: toEm(28) toEm(24);
    color: var(--danger-color);
  }

  &__retry {
    text-decoration: underline;
  }
}
</style>
