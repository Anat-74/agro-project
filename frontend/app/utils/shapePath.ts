/**
 * Параметрический вырез в правом нижнем углу (objectBoundingBox 0..1).
 * sx/sy считаются отдельно — карточка не квадратная, и один `s` давал
 * дуги невидимой амплитуды.
 */
export const notchBrPath = (opts: {
  r?: number; // радиус внешних углов
  sx?: number; // глубина выреза по X
  sy?: number; // глубина выреза по Y
  cr?: number; // радиус вогнутой дуги
} = {}): string => {
  const r = Math.max(0, Math.min(0.2, opts.r ?? 0.04));
  const sx = Math.max(0.05, Math.min(0.6, opts.sx ?? 0.31));
  const sy = Math.max(0.05, Math.min(0.6, opts.sy ?? 0.22));
  const cr = Math.max(0, Math.min(Math.min(sx, sy) / 2, opts.cr ?? 0.06));

  const x = 1 - sx; // левая граница выреза
  const y = 1 - sy; // верхняя граница выреза

  return [
    `M ${r} 0`,
    `H ${1 - r}`,
    `A ${r} ${r} 0 0 1 1 ${r}`,
    `V ${y}`, // правая кромка до выреза
    `A ${cr} ${cr} 0 0 1 ${x} ${y + cr}`, // заворот внутрь
    `V ${1 - r - cr}`, // стенка выреза
    `A ${cr} ${cr} 0 0 0 ${x + cr} ${1 - r}`, // заворот к нижней кромке
    `H ${r}`,
    `A ${r} ${r} 0 0 1 0 ${1 - r}`,
    `V ${r}`,
    `A ${r} ${r} 0 0 1 ${r} 0`,
    "Z",
  ].join(" ");
};
