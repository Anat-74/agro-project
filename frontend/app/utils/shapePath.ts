/**
 * Генератор SVG-path для фигур с вырезом.
 * Координаты — в objectBoundingBox (0..1), поэтому фигура масштабируется
 * вместе с блоком без пересчёта пикселей.
 */

export type ShapePreset = "notch-br" | "notch-tr";

export interface ShapeParams {
  /** радиус внешних углов, 0..1 */
  r?: number;
  /** размер выреза (глубина от угла), 0..1 */
  s?: number;
  /** радиус вогнутой дуги выреза, 0..1 */
  cr?: number;
}

export const shapePath = (
  preset: ShapePreset = "notch-br",
  { r = 0.03, s = 0.18, cr = 0.03 }: ShapeParams = {},
): string => {
  const R = Math.max(0, Math.min(0.5, r));
  const S = Math.max(0.02, Math.min(0.9, s));
  const CR = Math.max(0, Math.min(S / 2, cr));

  if (preset === "notch-tr") {
    // Вырез в правом ВЕРХНЕМ углу (для карточек с плашкой сверху)
    const x = 1 - S; // левая граница выреза
    return [
      `M ${R} 0`,
      `H ${x - CR}`,
      `A ${CR} ${CR} 0 0 1 ${x} ${CR}`, // вогнутая дуга вниз
      `V ${S - CR}`,
      `A ${CR} ${CR} 0 0 1 ${x + CR} ${S}`, // вогнутая дуга вправо
      `H ${1 - R}`,
      `A ${R} ${R} 0 0 1 1 ${R}`,
      `V ${1 - R}`,
      `A ${R} ${R} 0 0 1 ${1 - R} 1`,
      `H ${R}`,
      `A ${R} ${R} 0 0 1 0 ${1 - R}`,
      `V ${R}`,
      `A ${R} ${R} 0 0 1 ${R} 0`,
      "Z",
    ].join(" ");
  }

  // notch-br — вырез в правом НИЖНЕМ углу (карточка «в корзину»)
  const x = 1 - S; // левая граница выреза
  const y = 1 - S; // верхняя граница выреза
  return [
    `M ${R} 0`,
    `H ${1 - R}`,
    `A ${R} ${R} 0 0 1 1 ${R}`,
    `V ${y}`, // правая кромка до выреза
    `A ${CR} ${CR} 0 0 1 ${x} ${y + CR}`, // внутрь, вниз
    `V ${1 - R - CR}`, // стенка выреза
    `A ${CR} ${CR} 0 0 0 ${x + CR} ${1 - R}`, // дуга к нижней кромке
    `H ${R}`,
    `A ${R} ${R} 0 0 1 0 ${1 - R}`,
    `V ${R}`,
    `A ${R} ${R} 0 0 1 ${R} 0`,
    "Z",
  ].join(" ");
};
