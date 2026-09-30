/**
 * Конфигурации секций-калькулятора.
 *
 * Секция (CalcSection) не знает про конкретный раздел: режимы, назначения,
 * функции расчёта/строк/пачек, поле ввода, запросы к Strapi и тексты приходят
 * из конфигурации. Сейчас их две: «Посадка» и «Заготовки».
 */
import {
  gardenTranslations,
  preservesTranslations,
  type GardenTranslations,
} from "~/locales/garden";
import {
  GARDEN_MODES,
  GARDEN_PURPOSES,
  type GardenMode,
} from "~~/shared/utils/garden-modes";
import { PRESERVES_MODES, PRESERVES_PURPOSES } from "~~/shared/utils/preserves-modes";
import { calcPacks, calcPlanting, calcPlantsOf, calcPreserves } from "~~/shared/utils/calc";
import type {
  CalcInput,
  CalcPreservesInput,
  CalcPreservesResult,
  CalcResult,
} from "~~/shared/utils/calc";
import type {
  CalcRow,
  GardenCrop,
  GardenPackaging,
  GardenProduct,
  Preserve,
} from "~~/shared/types/garden";
import type { LocaleCode } from "~~/shared/types/locale";

/** Ключи локалей, значения которых — строки (для режимов, назначений, единиц) */
export type CalcTextKey = {
  [K in keyof GardenTranslations]: GardenTranslations[K] extends string ? K : never;
}[keyof GardenTranslations];

/** Режим секции (структурно общий для разделов) */
export interface CalcModeConfig {
  id: string;
  icon: string;
  key: CalcTextKey;
  /** Поле норм предмета, без которого режим не считается */
  dataField: string;
  /** Назначение товаров, фасовки которых участвуют в расчёте пачек */
  purpose: string;
}

/** Назначение товаров раздела (группы товаров) */
export interface CalcPurposeConfig {
  id: string;
  icon: string;
  key: CalcTextKey;
}

/** Контекст построения входа расчёта */
export interface CalcInputParams<TItem> {
  mode: string;
  item: TItem | null;
  /** Значение поля ввода в базовых единицах */
  value: number;
  packagings: GardenPackaging[];
}

/** Контекст сборки строк таблицы результата */
export interface CalcRowsParams<TItem, TResult> {
  mode: string;
  item: TItem;
  result: TResult;
  t: GardenTranslations;
  /** Подписи фасовок текущего режима (готовые строки «50 г × 2») */
  packsLabel: (mode: string) => string;
}

/** Контекст расчёта количества пачек товара */
export interface CalcPacksParams<TResult> {
  product: GardenProduct;
  result: TResult;
  /** Штучные единицы предмета (посадка — растения рассады) */
  itemUnits: number | null;
}

export interface CalcSectionConfig<
  TItem = GardenCrop,
  TResult = CalcResult,
  TInput = CalcInput,
> {
  /** Идентификатор раздела — основа ключей кэша */
  id: string;
  items: {
    endpoint: string;
    query: (locale: string) => Record<string, unknown>;
  };
  products: {
    endpoint: string;
    query: (locale: string, itemId: string) => Record<string, unknown>;
  };
  articles: {
    endpoint: string;
    query: (locale: string, itemId: string) => Record<string, unknown>;
  };
  page: {
    endpoint: string;
    query: (locale: string) => Record<string, unknown>;
  };
  /** Поле ввода: подпись, иконка и единицы (ключи локалей), значение — в базовых единицах */
  input: {
    icon: string;
    labelKey: CalcTextKey;
    units: { id: string; labelKey: CalcTextKey; factor: number }[];
  };
  /** Иконка заголовка блока предметов («Что сажаем?» / «Что заготавливаем?») */
  itemsIcon: string;
  /** Иконка заголовка блока калькулятора */
  calcIcon: string;
  /** Режимы расчёта (табы и слайды) */
  modes: CalcModeConfig[];
  /** Назначения товаров (группы товаров) */
  purposes: CalcPurposeConfig[];
  /** Вход расчёта из предмета и значения поля */
  buildInput: (params: CalcInputParams<TItem>) => TInput;
  /** Функция расчёта (формулы — кодом, нормы — данными) */
  calcFn: (input: TInput) => TResult;
  /** Строки таблицы результата */
  rows: (params: CalcRowsParams<TItem, TResult>) => CalcRow[];
  /** Сколько пачек товара нужно по расчёту */
  packs: (params: CalcPacksParams<TResult>) => number;
  /** Штучные единицы предмета (напр. растения рассады) */
  itemUnits?: (params: { item: TItem; value: number }) => number | null;
  /** Дополнительные сведения режима (раздел-специфичны) */
  infoFn?: (
    mode: string,
    item: TItem,
    t: GardenTranslations,
  ) => { label: string; value: string }[];
  /** Тексты раздела по локалям */
  locales: Record<LocaleCode, GardenTranslations>;
}

// ===== «Посадка» =====

/** Сведения режима для «Посадки»: сроки рассады, формула и вид удобрения */
export const plantingInfo = (
  m: string,
  item: GardenCrop,
  t: GardenTranslations,
): { label: string; value: string }[] => {
  const rows: { label: string; value: string }[] = [];

  if (m === "seedlings" && item.seedling) {
    const { growingDays, sowingPeriod, transplantPeriod } = item.seedling;
    if (growingDays) {
      rows.push({
        label: t.growingDays,
        value: `${growingDays} ${t.unitDay}`,
      });
    }
    if (sowingPeriod) {
      rows.push({ label: t.sowingLabel, value: sowingPeriod });
    }
    if (transplantPeriod) {
      rows.push({ label: t.transplantLabel, value: transplantPeriod });
    }
  }

  if (m === "fertilizer" && item.fertilizing) {
    const { npk, kind } = item.fertilizing;
    if (npk) rows.push({ label: t.npkLabel, value: npk });
    if (kind) {
      rows.push({
        label: t.kindLabel,
        value: kind === "organic" ? t.kindOrganic : t.kindMineral,
      });
    }
  }

  return rows;
};

/** Вход расчёта «Посадки»: нормы растения + площадь */
const gardenInput = (params: CalcInputParams<GardenCrop>): CalcInput => ({
  mode: params.mode as GardenMode,
  areaSqm: params.value,
  planting: params.item?.planting ?? null,
  seedling: params.item?.seedling ?? null,
  fertilizing: params.item?.fertilizing ?? null,
  packagings: params.packagings,
});

/** Строки результата для «Посадки»: растения, семена, удобрение и фасовки */
const gardenRows = ({ mode, result, t, packsLabel }: CalcRowsParams<GardenCrop, CalcResult>) => {
  const rows: CalcRow[] = [];

  if (result.plants !== null) {
    rows.push({
      label: mode === "seedlings" ? t.modeSeedlings : t.plants,
      value: result.plants,
    });
  }
  if (mode === "seeds" && result.seedGrams !== null) {
    rows.push({ label: t.seeds, value: `~${result.seedGrams} ${t.unitGram}` });
  }
  if (mode === "fertilizer" && result.fertilizerGrams !== null) {
    rows.push({
      label: t.fertilizer,
      value: `~${result.fertilizerGrams} ${t.unitGram}`,
    });
  }
  if (result.packs?.length) {
    rows.push({ label: t.packs, value: packsLabel(mode) });
  }

  return rows;
};

/** Штучные единицы «Посадки» — растения рассады */
const gardenItemUnits = ({ item, value }: { item: GardenCrop; value: number }) =>
  calcPlantsOf({
    mode: "seedlings",
    areaSqm: value,
    planting: item.planting ?? null,
    seedling: item.seedling ?? null,
  });

/**
 * Пачки товара «Посадки». Основа — НАЗНАЧЕНИЕ товара, а не активный режим:
 * семена — по граммам семян, удобрение — по граммам удобрения, рассада —
 * по растениям (штучные фасовки)
 */
const gardenPacks = ({ product, result, itemUnits }: CalcPacksParams<CalcResult>): number => {
  const base =
    product.purpose === "fertilizer"
      ? result.fertilizerGrams
      : product.purpose === "seedlings"
        ? null
        : result.seedGrams;
  const plants = product.purpose === "seedlings" ? itemUnits : result.plants;
  const packs = calcPacks(base, product.packaging ?? null, plants);
  return packs?.[0]?.count ?? 1;
};

/** Раздел «Посадка и урожай» */
export const GARDEN_SECTION: CalcSectionConfig = {
  id: "garden",
  items: {
    endpoint: "crops",
    query: (locale) => ({
      filters: {
        locale: { $eq: locale },
        isActive: { $eq: true },
      },
      sort: ["name:asc"],
      pagination: { pageSize: 100 },
      populate: {
        planting: true,
        seedling: true,
        fertilizing: true,
        image: { fields: ["alternativeText", "url"] },
      },
    }),
  },
  products: {
    endpoint: "products",
    query: (locale, itemId) => ({
      filters: {
        locale: { $eq: locale },
        crop: { documentId: { $eq: itemId } },
      },
      pagination: { pageSize: 100 },
      populate: {
        mainImage: { fields: ["alternativeText", "url"] },
        image: { fields: ["alternativeText", "url"] },
        packaging: true,
        // нужны для getProductLink (категория/подкатегория → URL товара)
        category: { fields: ["slug"] },
        subcategory: {
          fields: ["slug"],
          populate: { category: { fields: ["slug"] } },
        },
      },
    }),
  },
  articles: {
    endpoint: "blogs",
    query: (locale, itemId) => ({
      filters: {
        locale: { $eq: locale },
        crops: { documentId: { $eq: itemId } },
      },
      sort: ["date:desc"],
      pagination: { pageSize: 10 },
      fields: ["title", "slug", "date", "mode"],
    }),
  },
  page: {
    endpoint: "calculator-page",
    query: (locale) => ({
      filters: { locale: { $eq: locale } },
      populate: { faq: true },
    }),
  },
  input: {
    icon: "mdi:ruler-square",
    labelKey: "areaLabel",
    units: [
      { id: "sqm", labelKey: "areaUnitSqm", factor: 1 },
      { id: "sotka", labelKey: "areaUnitSotkaTab", factor: 100 },
    ],
  },
  itemsIcon: "mdi:sprout-outline",
  calcIcon: "mdi:calculator-variant-outline",
  modes: GARDEN_MODES,
  purposes: GARDEN_PURPOSES,
  buildInput: gardenInput,
  calcFn: calcPlanting,
  rows: gardenRows,
  packs: gardenPacks,
  itemUnits: gardenItemUnits,
  infoFn: plantingInfo,
  locales: gardenTranslations,
};

// ===== «Заготовки» =====

/** Нормы выбранного режима: поле берём по `dataField` режима из реестра */
const preserveNorms = (item: Preserve | null, mode: string) => {
  if (!item) return null;
  const field = PRESERVES_MODES.find((entry) => entry.id === mode)?.dataField;
  return field ? item[field] ?? null : null;
};

/** Вход расчёта «Заготовок»: вес продукта + нормы режима */
const preservesInput = (params: CalcInputParams<Preserve>): CalcPreservesInput => ({
  weightKg: params.value,
  norms: preserveNorms(params.item, params.mode),
  packagings: params.packagings,
});

/** Строки результата «Заготовок»: сахар, соль, уксус, вода, выход, фасовки */
const preservesRows = ({
  mode,
  result,
  t,
  packsLabel,
}: CalcRowsParams<Preserve, CalcPreservesResult>): CalcRow[] => {
  const rows: CalcRow[] = [];

  if (result.sugarGrams !== null) {
    rows.push({ label: t.sugar, value: `${result.sugarGrams} ${t.unitG}` });
  }
  if (result.saltGrams !== null) {
    rows.push({ label: t.salt, value: `${result.saltGrams} ${t.unitG}` });
  }
  if (result.vinegarMl !== null) {
    rows.push({ label: t.vinegar, value: `${result.vinegarMl} ${t.unitMl}` });
  }
  if (result.waterMl !== null) {
    rows.push({ label: t.water, value: `${result.waterMl} ${t.unitMl}` });
  }
  if (result.yieldLiters !== null) {
    rows.push({ label: t.yield, value: `${result.yieldLiters} ${t.unitL}` });
  }
  if (result.packs?.length) {
    rows.push({ label: t.packs, value: packsLabel(mode) });
  }

  return rows;
};

/**
 * Пачки товара «Заготовок»: ингредиенты — по сыпучим (сахар + соль),
 * тара — по литрам готового продукта (штучные фасовки, банка ≈ 1 л)
 */
const preservesPacks = ({ product, result }: CalcPacksParams<CalcPreservesResult>): number => {
  if (product.purpose === "jars") {
    const jars = result.yieldLiters ? Math.ceil(result.yieldLiters) : null;
    const packs = calcPacks(null, product.packaging ?? null, jars);
    return packs?.[0]?.count ?? 1;
  }

  const bulk = (result.sugarGrams ?? 0) + (result.saltGrams ?? 0);
  const packs = calcPacks(bulk > 0 ? bulk : null, product.packaging ?? null, null);
  return packs?.[0]?.count ?? 1;
};

/** Раздел «Заготовки» */
export const PRESERVES_SECTION: CalcSectionConfig<Preserve, CalcPreservesResult, CalcPreservesInput> = {
  id: "preserves",
  items: {
    endpoint: "preserves",
    query: (locale) => ({
      filters: {
        locale: { $eq: locale },
        isActive: { $eq: true },
      },
      sort: ["name:asc"],
      pagination: { pageSize: 100 },
      populate: {
        jam: true,
        canning: true,
        salting: true,
        compote: true,
        image: { fields: ["alternativeText", "url"] },
      },
    }),
  },
  products: {
    endpoint: "products",
    // Ингредиенты и тара — общие для раздела (не привязаны к конкретному
    // продукту), поэтому выбираем товары по назначению, а не по связи
    query: (locale) => ({
      filters: {
        locale: { $eq: locale },
        purpose: { $in: ["ingredients", "jars"] },
      },
      pagination: { pageSize: 100 },
      populate: {
        mainImage: { fields: ["alternativeText", "url"] },
        image: { fields: ["alternativeText", "url"] },
        packaging: true,
        category: { fields: ["slug"] },
        subcategory: {
          fields: ["slug"],
          populate: { category: { fields: ["slug"] } },
        },
      },
    }),
  },
  articles: {
    endpoint: "blogs",
    query: (locale, itemId) => ({
      filters: {
        locale: { $eq: locale },
        preserves: { documentId: { $eq: itemId } },
      },
      sort: ["date:desc"],
      pagination: { pageSize: 10 },
      fields: ["title", "slug", "date", "mode"],
    }),
  },
  page: {
    endpoint: "preserve-page",
    query: (locale) => ({
      filters: { locale: { $eq: locale } },
      populate: { faq: true },
    }),
  },
  input: {
    icon: "mdi:scale-bathroom",
    labelKey: "weightLabel",
    units: [
      { id: "kg", labelKey: "unitKg", factor: 1 },
      { id: "g", labelKey: "unitG", factor: 0.001 },
    ],
  },
  itemsIcon: "mdi:pot-steam-outline",
  calcIcon: "mdi:calculator-variant-outline",
  modes: PRESERVES_MODES,
  purposes: PRESERVES_PURPOSES,
  buildInput: preservesInput,
  calcFn: calcPreserves,
  rows: preservesRows,
  packs: preservesPacks,
  locales: preservesTranslations,
};
