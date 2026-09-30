/**
 * Реестр режимов и назначений раздела «Заготовки».
 *
 * Как и в «Посадке» (garden-modes.ts), состав режимов, иконки и ключи локалей
 * живут данными: компонент-движок сам ничего про раздел не знает.
 */
import type { PreserveMode, PreservePurpose } from "../types/garden";

interface PreservePurposeConfig {
  id: PreservePurpose;
  icon: string;
  key: "purposeIngredients" | "purposeJars" | "purposeOther";
}

interface PreserveModeConfig {
  id: PreserveMode;
  icon: string;
  key: "modeJam" | "modeCanning" | "modeSalting" | "modeCompote";
  /** Поле норм продукта, без которого режим не считается */
  dataField: "jam" | "canning" | "salting" | "compote";
  /** Назначение товаров, фасовки которых участвуют в расчёте пачек */
  purpose: PreservePurpose;
}

/** Иконка «прочего» — она же запасной вариант для неизвестного назначения */
const OTHER_ICON = "mingcute:basket-2-line";

/** Назначения товаров раздела: ингредиенты, тара, прочее */
export const PRESERVES_PURPOSES: PreservePurposeConfig[] = [
  { id: "ingredients", icon: "mdi:food-variant", key: "purposeIngredients" },
  { id: "jars", icon: "mdi:glass-mug-variant", key: "purposeJars" },
  { id: "other", icon: OTHER_ICON, key: "purposeOther" },
];

/** Режимы расчёта: порядок задаёт порядок табов и слайдов */
export const PRESERVES_MODES: PreserveModeConfig[] = [
  {
    id: "jam",
    icon: "mdi:pot-steam-outline",
    key: "modeJam",
    dataField: "jam",
    purpose: "ingredients",
  },
  {
    id: "canning",
    icon: "mdi:glass-mug-variant",
    key: "modeCanning",
    dataField: "canning",
    purpose: "ingredients",
  },
  {
    id: "salting",
    icon: "mdi:shaker-outline",
    key: "modeSalting",
    dataField: "salting",
    purpose: "ingredients",
  },
  {
    id: "compote",
    icon: "mdi:cup-water",
    key: "modeCompote",
    dataField: "compote",
    purpose: "ingredients",
  },
];

/** Иконка назначения */
export const preservesPurposeIcon = (purpose: PreservePurpose): string =>
  PRESERVES_PURPOSES.find((item) => item.id === purpose)?.icon ?? OTHER_ICON;

/** Конфигурация режима по id */
export const preserveMode = (id: PreserveMode): PreserveModeConfig | undefined =>
  PRESERVES_MODES.find((item) => item.id === id);
