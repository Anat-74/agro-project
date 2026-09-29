import type { Product } from "./product";

/** Нормы посева растения (crop.planting) */
export interface GardenPlanting {
  rowSpacing?: number | null;
  plantSpacing?: number | null;
  seedsPerHole?: number | null;
  seedRatePerSqM?: number | null;
  seedRatePerPlant?: number | null;
  germination?: number | null;
  seedingDepth?: number | null;
}

/** Параметры рассады (crop.seedling) */
export interface GardenSeedling {
  plantsPerSqM?: number | null;
  growingDays?: number | null;
  sowingPeriod?: string | null;
  transplantPeriod?: string | null;
}

/** Удобрение (crop.fertilizing) */
export interface GardenFertilizing {
  ratePerSqM?: number | null;
  applications?: number | null;
  npk?: string | null;
  kind?: "mineral" | "organic" | string | null;
}

/** Растение раздела «Посадка» (crop) */
export interface GardenCrop {
  documentId: string;
  name: string;
  slug?: string;
  image?: { url?: string; alternativeText?: string } | null;
  planting?: GardenPlanting | null;
  seedling?: GardenSeedling | null;
  fertilizing?: GardenFertilizing | null;
}

/** Назначение товара в разделе (product.purpose) */
export type GardenPurpose = "seeds" | "seedlings" | "fertilizer" | "other";

/** Назначение товара в разделе «Заготовки» */
export type PreservePurpose = "ingredients" | "jars" | "other";

/** Общее назначение товара: «Посадка» + «Заготовки» */
export type CalcPurpose = GardenPurpose | PreservePurpose;

/** Фасовка товара (product.packaging) */
export interface GardenPackaging {
  label?: string | null;
  amount?: number | null;
  unit?: string | null;
}

/** Товар раздела: Product + поля раздела */
export interface GardenProduct extends Product {
  purpose?: CalcPurpose | null;
  packaging?: GardenPackaging[] | null;
}

/** Строка таблицы результата расчёта */
export interface CalcRow {
  label: string;
  value: string | number;
}

/** Нормы заготовки на 1 кг продукта (preserve.norms) */
export interface PreserveNorms {
  sugarPerKg?: number | null;
  saltPerKg?: number | null;
  vinegarPerKg?: number | null;
  waterPerKg?: number | null;
  yieldPerKg?: number | null;
  note?: string | null;
}

/** Режим раздела «Заготовки» */
export type PreserveMode = "jam" | "canning" | "salting";

/** Продукт раздела «Заготовки» (preserve) */
export interface Preserve {
  documentId: string;
  name: string;
  slug?: string;
  image?: { url?: string; alternativeText?: string } | null;
  shortDescription?: string | null;
  description?: string | null;
  isActive?: boolean | null;
  jam?: PreserveNorms | null;
  canning?: PreserveNorms | null;
  salting?: PreserveNorms | null;
}
