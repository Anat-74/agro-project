/**
 * Расчётная логика секции-калькулятора: режимы, строки результата, пачки.
 *
 * Вся специфика раздела приходит конфигурацией (режимы, назначения, вход/функция
 * расчёта, строки, пачки, штучные единицы, доп. сведения), поэтому один
 * composable обслуживает и «Посадку», и «Заготовки». Шаблон — в компоненте.
 */
import type { CalcSectionConfig } from "~/utils/calcSections";
import type { CalcRow, GardenPackaging, GardenProduct } from "~~/shared/types/garden";
import type { GardenTranslations } from "~/locales/garden";

interface UseGardenCalculatorOptions<TItem, TResult, TInput> {
  /** Конфигурация раздела */
  config: ComputedRef<CalcSectionConfig<TItem, TResult, TInput>>;
  /** Выбранный предмет (растение / продукт заготовки) */
  selectedItem: ComputedRef<TItem | null>;
  /** Товары раздела (их фасовки нужны для расчёта пачек) */
  products: Ref<GardenProduct[] | null | undefined>;
  /** Значение поля ввода в базовых единицах */
  value: Ref<number>;
  /** Активный режим расчёта */
  mode: Ref<string>;
  /** Переводы раздела */
  t: ComputedRef<GardenTranslations>;
}

export const useGardenCalculator = <TItem extends { documentId: string }, TResult, TInput>(
  options: UseGardenCalculatorOptions<TItem, TResult, TInput>,
) => {
  const { config, selectedItem, products, value, mode, t } = options;

  // Табы режимов (они же слайды) — из конфигурации раздела
  const modeTabs = computed<{ id: string; label: string; icon: string }[]>(() =>
    config.value.modes.map((item) => ({
      id: item.id,
      label: t.value[item.key],
      icon: item.icon,
    })),
  );

  // Фасовки товаров по назначению → пачки для активного режима
  const packagingsByPurpose = computed<Record<string, GardenPackaging[]>>(() => {
    const pick = (purpose: string) =>
      (products.value ?? [])
        .filter((p) => p.purpose === purpose)
        .flatMap((p) => p.packaging ?? [])
        .filter((pk) => pk?.amount)
        .map((pk) => ({ label: pk.label ?? "", amount: pk.amount ?? 0, unit: pk.unit ?? "g" }));

    const out: Record<string, GardenPackaging[]> = {};
    for (const item of config.value.modes) out[item.id] = pick(item.purpose);
    return out;
  });

  // Расчёт по конкретному режиму — нужен слайдам (каждый слайд = режим расчёта)
  const resultFor = (m: string) =>
    config.value.calcFn(
      config.value.buildInput({
        mode: m,
        item: selectedItem.value,
        value: value.value,
        packagings: packagingsByPurpose.value[m] ?? [],
      }),
    );

  // Расчёт активного режима (для товаров и логики вне слайдера)
  const result = computed(() => resultFor(mode.value));

  // Есть ли данные предмета под конкретный режим
  const hasModeDataFor = (m: string) => {
    const item = selectedItem.value as Record<string, unknown> | null;
    const cfg = config.value.modes.find((entry) => entry.id === m);
    if (!item || !cfg) return false;
    return !!item[cfg.dataField];
  };

  // Подписи фасовок для слайда (у результата есть поле packs)
  const packsLabel = (m: string) =>
    ((resultFor(m) as { packs?: { label: string; count: number }[] | null }).packs ?? [])
      .map((pack) => `${pack.label} × ${pack.count}`)
      .join(", ");

  // Строки таблицы результата: сборка — из конфигурации, доп. сведения — следом
  const resultRowsFor = (m: string): CalcRow[] => {
    const item = selectedItem.value;
    if (!item) return [];

    const rows = config.value.rows({
      mode: m,
      item,
      result: resultFor(m),
      t: t.value,
      packsLabel,
    });
    const extra = config.value.infoFn ? config.value.infoFn(m, item, t.value) : [];
    return [...rows, ...extra];
  };

  // Штучные единицы предмета (напр. растения рассады) — для штучных фасовок
  const itemUnits = computed(() =>
    selectedItem.value && config.value.itemUnits
      ? config.value.itemUnits({ item: selectedItem.value, value: value.value })
      : null,
  );

  // Сколько пачек товара нужно по расчёту
  const packCountFor = (product: GardenProduct): number =>
    config.value.packs({
      product,
      result: result.value,
      itemUnits: itemUnits.value,
    });

  return {
    modeTabs,
    packagingsByPurpose,
    resultFor,
    result,
    hasModeDataFor,
    packsLabel,
    resultRowsFor,
    itemUnits,
    packCountFor,
  };
};
