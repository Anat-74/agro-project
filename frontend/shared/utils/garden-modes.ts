/**
 * Реестр режимов и назначений калькулятора посадок — единственное место, где
 * перечислены режимы: их id, иконка, подпись (ключ локали), поле норм растения
 * и назначение товара.
 *
 * Формулы расчёта остаются кодом (`shared/utils/calc.ts`), а состав режимов,
 * иконки и подписи — данными этого реестра. Второй раздел («Заготовки»)
 * добавляет свой реестр, не дублируя компонент калькулятора.
 */
import type { CalcMode } from "./calc";

/** Назначение товара (поле `purpose` у Product) */
export type GardenPurpose = "seeds" | "seedlings" | "fertilizer" | "other";

/** Режим калькулятора (пока совпадает с типом расчёта) */
export type GardenMode = CalcMode;

/** Поле норм растения, которое нужно режиму */
export type GardenCropField = "planting" | "seedling" | "fertilizing";

export interface GardenPurposeConfig {
  id: GardenPurpose;
  icon: string;
  key: "purposeSeeds" | "purposeSeedlings" | "purposeFertilizer" | "purposeOther";
}

export interface GardenModeConfig {
  id: GardenMode;
  purpose: GardenPurpose;
  key: "modeSeeds" | "modeSeedlings" | "modeFertilizer";
  /** Поле норм растения, без которого режим не считается */
  dataField: GardenCropField;
}

/** Иконка «прочего» — она же запасной вариант для неизвестного назначения */
const OTHER_ICON = "mingcute:basket-2-line";

/** Назначения товаров: иконка и подпись (используются и в группах товаров) */
export const GARDEN_PURPOSES: GardenPurposeConfig[] = [
  { id: "seeds", icon: "mdi:seed-outline", key: "purposeSeeds" },
  { id: "seedlings", icon: "mdi:sprout-outline", key: "purposeSeedlings" },
  { id: "fertilizer", icon: "mingcute:flask-2-line", key: "purposeFertilizer" },
  { id: "other", icon: OTHER_ICON, key: "purposeOther" },
];

/** Режимы расчёта: порядок задаёт порядок табов и слайдов */
export const GARDEN_MODES: GardenModeConfig[] = [
  { id: "seeds", purpose: "seeds", key: "modeSeeds", dataField: "planting" },
  { id: "seedlings", purpose: "seedlings", key: "modeSeedlings", dataField: "seedling" },
  { id: "fertilizer", purpose: "fertilizer", key: "modeFertilizer", dataField: "fertilizing" },
];

/** Иконка назначения (иконки режимов берутся по их назначению) */
export const gardenPurposeIcon = (purpose: GardenPurpose): string =>
  GARDEN_PURPOSES.find((item) => item.id === purpose)?.icon ?? OTHER_ICON;

/** Конфигурация режима по id */
export const gardenMode = (id: GardenMode): GardenModeConfig | undefined =>
  GARDEN_MODES.find((item) => item.id === id);
