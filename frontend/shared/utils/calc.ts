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

export interface CalcSeedling {
  /** Плотность рассады, растений на м² */
  plantsPerSqM?: number | null;
  /** Срок выращивания рассады, дней */
  growingDays?: number | null;
  /** Срок посева на рассаду (текстом) */
  sowingPeriod?: string | null;
  /** Срок высадки в грунт (текстом) */
  transplantPeriod?: string | null;
}

export interface CalcFertilizing {
  /** Норма удобрения, г/м² за одну подкормку */
  ratePerSqM?: number | null;
  /** Количество подкормок за сезон */
  applications?: number | null;
  /** Формула NPK, например 10-10-20 */
  npk?: string | null;
  /** Вид удобрения: минеральное / органическое */
  kind?: "mineral" | "organic" | string | null;
}

export interface CalcPackaging {
  label?: string | null;
  amount?: number | null;
  unit?: "g" | "kg" | "pcs" | string | null;
}

/** Режим калькулятора: семена / рассада / удобрение */
export type CalcMode = "seeds" | "seedlings" | "fertilizer";

export interface CalcInput {
  /** Режим расчёта (по умолчанию — семена) */
  mode?: CalcMode | null;
  /** Площадь, м² (если известна) */
  areaSqm?: number | null;
  /** Длина грядки, м (если площадь не задана — считаем от схемы) */
  bedLengthM?: number | null;
  /** Параметры посева растения */
  planting?: CalcPlanting | null;
  /** Параметры рассады растения */
  seedling?: CalcSeedling | null;
  /** Параметры удобрения растения */
  fertilizing?: CalcFertilizing | null;
  /** Норма удобрения, г/м² (совместимость с чат-инструментом) */
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
  /** Режим, по которому считали */
  mode: CalcMode;
  /** Итоговая площадь, м² */
  areaSqm: number;
  /** Кол-во растений (может быть null, если нет схемы) */
  plants: number | null;
  /** Нужно семян, г (null если посчитать нельзя) */
  seedGrams: number | null;
  /** Нужно удобрения, г */
  fertilizerGrams: number | null;
  /** Срок выращивания рассады, дней (режим рассады) */
  growingDays: number | null;
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

/** Растений на площади для режима: в режиме рассады — плотность рассады, иначе схема посева. */
export const calcPlantsOf = (
  input: CalcInput,
  areaSqm = calcAreaSqm(input),
): number | null => {
  if ((input.mode ?? "seeds") === "seedlings") {
    const density = input.seedling?.plantsPerSqM;
    if (density && density > 0 && areaSqm > 0) return Math.round(areaSqm * density);
  }
  return calcPlants(input, areaSqm);
};

/** Нужно удобрения, г: площадь × норма × число подкормок. */
export const calcFertilizerGrams = (
  input: CalcInput,
  areaSqm = calcAreaSqm(input),
): number | null => {
  const rate = input.fertilizing?.ratePerSqM ?? input.fertilizerRatePerSqM;
  if (!rate || rate <= 0 || areaSqm <= 0) return null;
  const times = input.fertilizing?.applications;
  return areaSqm * rate * (times && times > 0 ? times : 1);
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
 * Режимы: `seeds` — семена, `seedlings` — рассада (плотность, шт), `fertilizer` — удобрение.
 * Граммы удобрения считаются всегда, если задана норма; пачки — по активному режиму.
 */
export const calcPlanting = (input: CalcInput): CalcResult => {
  const mode: CalcMode = input.mode ?? "seeds";
  const areaSqm = calcAreaSqm(input);
  const plants = calcPlantsOf(input, areaSqm);

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
  const fertilizerGrams = calcFertilizerGrams(input, areaSqm);

  // Основа для расчёта пачек: в режиме рассады — штучные фасовки (по растениям),
  // в режиме удобрения — граммы удобрения, иначе граммы семян
  const base =
    mode === "seedlings"
      ? null
      : mode === "fertilizer"
        ? fertilizerGrams
        : seedGrams ?? fertilizerGrams;

  return {
    mode,
    areaSqm: round2(areaSqm),
    plants,
    seedGrams: seedGrams === null ? null : round2(seedGrams),
    fertilizerGrams:
      fertilizerGrams === null ? null : round2(fertilizerGrams),
    growingDays: input.seedling?.growingDays ?? null,
    packs: calcPacks(base, input.packagings, plants),
  };
};

// ===== Заготовки (варенье / консервация / засолка) =====

/** Нормы заготовки на 1 кг продукта */
export interface CalcPreserveNorms {
  sugarPerKg?: number | null;
  saltPerKg?: number | null;
  vinegarPerKg?: number | null;
  waterPerKg?: number | null;
  yieldPerKg?: number | null;
  note?: string | null;
}

export interface CalcPreservesInput {
  /** Вес продукта, кг */
  weightKg?: number | null;
  /** Нормы выбранного режима (на 1 кг продукта) */
  norms?: CalcPreserveNorms | null;
  /** Фасовки товаров (для перевода ингредиентов в пачки) */
  packagings?: CalcPackaging[] | null;
}

export interface CalcPreservesResult {
  /** Вес продукта, кг */
  weightKg: number;
  /** Сахар, г */
  sugarGrams: number | null;
  /** Соль, г */
  saltGrams: number | null;
  /** Уксус, мл */
  vinegarMl: number | null;
  /** Вода, мл */
  waterMl: number | null;
  /** Выход готового продукта, л */
  yieldLiters: number | null;
  /** Варианты фасовок под потребность (сейчас — от суммарных сыпучих) */
  packs: CalcPack[] | null;
}

/** Норма на 1 кг → количество на вес продукта (0/отрицательные игнорируем) */
const perKg = (rate: number | null | undefined, weightKg: number): number | null =>
  rate && rate > 0 && weightKg > 0 ? rate * weightKg : null;

/**
 * Расчёт заготовки: вес продукта × нормы на 1 кг → сахар, соль, уксус, вода, выход.
 * Режим (варенье / консервация / засолка) выбирает набор норм — это делает раздел.
 */
export const calcPreserves = (input: CalcPreservesInput): CalcPreservesResult => {
  const weightKg = input.weightKg && input.weightKg > 0 ? input.weightKg : 0;
  const norms = input.norms ?? null;

  const sugarGrams = perKg(norms?.sugarPerKg, weightKg);
  const saltGrams = perKg(norms?.saltPerKg, weightKg);
  const vinegarMl = perKg(norms?.vinegarPerKg, weightKg);
  const waterMl = perKg(norms?.waterPerKg, weightKg);
  const yieldLiters = perKg(norms?.yieldPerKg, weightKg);

  // Пачки пока считаем от суммарных сыпучих (сахар + соль): точная привязка
  // «товар → ингредиент» требует отдельного поля у продукта
  const bulk = (sugarGrams ?? 0) + (saltGrams ?? 0);
  const packs = calcPacks(bulk > 0 ? bulk : null, input.packagings, null);

  return {
    weightKg: round2(weightKg),
    sugarGrams: sugarGrams === null ? null : round2(sugarGrams),
    saltGrams: saltGrams === null ? null : round2(saltGrams),
    vinegarMl: vinegarMl === null ? null : round2(vinegarMl),
    waterMl: waterMl === null ? null : round2(waterMl),
    yieldLiters: yieldLiters === null ? null : round2(yieldLiters),
    packs,
  };
};
