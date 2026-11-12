//* Скидка на товар: админ задаёт процент в Strapi (`discountPercent` + `isDiscount`),
//* итоговая цена считается ЗДЕСЬ и только здесь (карточка, страница товара, корзина,
//* заказ) — иначе суммы разойдутся.
//* Правило: скидка действует только если `isDiscount === true` и процент > 0.
//* Округление итоговой цены — до копеек (2 знака).

type Discountable = {
  price: number | string;
  isDiscount?: boolean | null;
  discountPercent?: number | string | null;
};

const toNumber = (value: number | string | null | undefined) => {
  const num = typeof value === "string" ? Number.parseFloat(value) : value;
  return Number.isFinite(num as number) ? (num as number) : 0;
};

/** Процент скидки с учётом флага (0 — скидки нет), целое 1..99 */
export const discountPercent = (product: Discountable) => {
  if (!product?.isDiscount) return 0;
  const percent = Math.round(toNumber(product.discountPercent));
  return percent > 0 && percent < 100 ? percent : 0;
};

/** Итоговая цена (то, что платит покупатель), 2 знака */
export const finalPrice = (product: Discountable) => {
  const price = toNumber(product?.price);
  const percent = discountPercent(product);
  if (!percent) return Math.round(price * 100) / 100;
  return Math.round(price * (100 - percent)) / 100;
};

/** Была ли цена со скидкой (для показа старой цены) */
export const hasDiscount = (product: Discountable) =>
  discountPercent(product) > 0 && finalPrice(product) < toNumber(product?.price);
