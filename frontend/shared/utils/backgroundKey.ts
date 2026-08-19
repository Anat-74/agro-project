// Типы страниц для выбора фона (по ним сохраняется выбранный фон в localStorage)
export type BackgroundKey =
  | "home"
  | "catalog"
  | "blog"
  | "news"
  | "cart"
  | "auth"
  | "cabinet"
  | "static";

// Маршрут → тип страницы (для фонов по типам страниц).
// Примеры: /ru → home, /ru/bobovye → catalog, /ru/blog → blog, /ru/cartshopping → cart
export const getBackgroundKey = (path: string): BackgroundKey => {
  // Отбрасываем локаль (/ru, /be)
  const p = path.replace(/^\/(ru|be)(\/|$)/, "/");

  if (p === "/" || p === "") return "home";
  if (p.startsWith("/blog")) return "blog";
  if (p.startsWith("/news")) return "news";
  if (p.startsWith("/cartshopping")) return "cart";
  if (p.startsWith("/auth")) return "auth";
  if (p.startsWith("/cabinet")) return "cabinet";
  if (p.startsWith("/about") || p.startsWith("/contacts") || p.startsWith("/services")) return "static";

  // Каталог: категории, подкатегории, товары, списки
  return "catalog";
};
