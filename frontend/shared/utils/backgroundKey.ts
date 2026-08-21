// Типы страниц для выбора фона (по ним сохраняется выбранный фон в localStorage)
export type BackgroundKey =
  | "home"
  | "catalog"
  | "subcategory"
  | "product"
  | "products"
  | "blog"
  | "news"
  | "cart"
  | "auth"
  | "cabinet"
  | "about"
  | "services"
  | "contacts";

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
  if (p.startsWith("/about")) return "about";
  if (p.startsWith("/services")) return "services";
  if (p.startsWith("/contacts")) return "contacts";

  // Каталог: сегменты после локали
  const segments = p.split("/").filter(Boolean);

  // Карточки товаров ([cat]/[subcat]/[slug] и [cat]/products/[slug]) — отдельный тип
  if (segments.length === 3) return "product";

  // [cat]/products — список товаров категории
  if (p.includes("/products")) return "products";

  // [cat]/[subcat] — подкатегория
  if (segments.length === 2) return "subcategory";

  // Категории
  return "catalog";
};
