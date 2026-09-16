/**
 * Логика калькулятора посадок (чистые функции, без Vue/Strapi).
 *
 * Используется и на клиенте (слайд «Посадка»), и на сервере (чат-инструмент),
 * поэтому лежит в shared/utils (автоимпорт Nuxt 4 в app и server).
 *
 * Единицы: площади — м², размеры схемы — см, норма высева — г/м², вес — г.
 */

export interface CalcPlanting {
  rowSpacing?: number | null;
  plantSpacing?: number | null;
  seedsPerHole?: number | null;
  seedRatePerSqM?: number | null;
  seedRatePerPlant?: number | null;
  germination?: number | null;
  seedingDepth?: number | null;
}

export interface CalcPackaging {
  label?: string | null;
  amount?: number | null;
  unit?: "g" | "kg" | "pcs" | string | null;
}

export interface CalcInput {
  /** Площадь, м² (если известна) */
  areaSqm?: number | null;
  /** Длина грядки, м (если площадь не задана — считаем от схемы) */
  bedLengthM?: number | null;
  /** Параметры посева растения */
  planting?: CalcPlanting | null;
  /** Норма удобрения, г/м² (для режима fertilizer) */
  fertilizerRatePerSqM?: number | null;
  /** Варианты фасовки товара (для перевода граммов в пачки) */
  packagings?: CalcPackaging[] | null;
}

export interface CalcPack {
  label: string;
  /** Количество упаковок (округление вверх) */
  count: number;
  /** Вес одной упаковки в граммах (null для штучных) */
  packGrams: number | null;
}

export interface CalcResult {
  /** Итоговая площадь, м² */
  areaSqm: number;
  /** Кол-во растений (может быть null, если нет схемы) */
  plants: number | null;
  /** Нужно семян, г (null если посчитать нельзя) */
  seedGrams: number | null;
  /** Нужно удобрения, г */
  fertilizerGrams: number | null;
  /** Варианты фасовок под потребность */
  packs: CalcPack[] | null;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

/** Площадь: напрямую или длина грядки × междурядье (как ширина грядки). */
export const calcAreaSqm = (input: CalcInput): number => {
  if (input.areaSqm && input.areaSqm > 0) return input.areaSqm;

  const row = input.planting?.rowSpacing;
  if (input.bedLengthM && row && row > 0) {
    // rowSpacing в см → ширина грядки в м
    return round2(input.bedLengthM * (row / 100));
  }
  return 0;
};

/** Растений на 1 м² по схеме посадки (междурядье × шаг в ряду). */
export const calcPlantsPerSqM = (planting?: CalcPlanting | null): number | null => {
  const row = planting?.rowSpacing;
  const step = planting?.plantSpacing;
  if (!row || !step || row <= 0 || step <= 0) return null;
  // 1 м² = 10 000 см²; площадь питания одного растения = row × step (см²)
  return 10000 / (row * step);
};

/** Кол-во растений на площади. */
export const calcPlants = (
  input: CalcInput,
  areaSqm = calcAreaSqm(input),
): number | null => {
  const perSqM = calcPlantsPerSqM(input.planting);
  if (!perSqM) return null;
  return Math.round(areaSqm * perSqM);
};

/** Граммы фасовки (кг → г; штучные → null). */
export const packGrams = (p: CalcPackaging): number | null => {
  if (!p?.amount || p.amount <= 0) return null;
  if (p.unit === "kg") return p.amount * 1000;
  if (p.unit === "pcs") return null;
  return p.amount;
};

/** Количество упаковок под потребность (округление вверх). */
export const calcPacks = (
  grams: number | null,
  packagings?: CalcPackaging[] | null,
  plants?: number | null,
): CalcPack[] | null => {
  if (!packagings?.length) return null;

  const out: CalcPack[] = [];
  for (const p of packagings) {
    const pg = packGrams(p);
    const label = p.label || (pg ? `${pg} г` : "");
    if (pg) {
      if (!grams || grams <= 0) continue;
      out.push({ label, count: Math.ceil(grams / pg), packGrams: pg });
    } else if (p.unit === "pcs" && p.amount && plants) {
      out.push({ label, count: Math.ceil(plants / p.amount), packGrams: null });
    }
  }
  return out.length ? out : null;
};

/**
 * Полный расчёт: площадь → растения → граммы семян (с учётом всхожести) → пачки.
 * Если задана `fertilizerRatePerSqM` — считаем граммы удобрения.
 */
export const calcPlanting = (input: CalcInput): CalcResult => {
  const areaSqm = calcAreaSqm(input);
  const plants = calcPlants(input, areaSqm);

  // Семена: норма на растение → иначе норма на м²
  let seedGrams: number | null = null;
  const perPlant = input.planting?.seedRatePerPlant;
  const perSqM = input.planting?.seedRatePerSqM;
  if (perPlant && plants) {
    seedGrams = plants * perPlant;
  } else if (perSqM && areaSqm) {
    seedGrams = areaSqm * perSqM;
  }
  // Поправка на всхожесть (сеем больше)
  const germ = input.planting?.germination;
  if (seedGrams && germ && germ > 0) {
    seedGrams = seedGrams / (germ / 100);
  }

  // Удобрение
  const fertilizerGrams =
    input.fertilizerRatePerSqM && areaSqm
      ? areaSqm * input.fertilizerRatePerSqM
      : null;

  const base = seedGrams ?? fertilizerGrams ?? null;

  return {
    areaSqm: round2(areaSqm),
    plants,
    seedGrams: seedGrams === null ? null : round2(seedGrams),
    fertilizerGrams:
      fertilizerGrams === null ? null : round2(fertilizerGrams),
    packs: calcPacks(base, input.packagings, plants),
  };
};
