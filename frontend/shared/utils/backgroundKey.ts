// Типы страниц для выбора фона (по ним сохраняется выбранный фон в localStorage)
export type BackgroundKey =
  | "home"
  | "catalog"
  | "subcategory"
  | "products"
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

  // Каталог: страницы со списком/карточкой товара (/products) — отдельный тип
  if (p.includes("/products")) return "products";

  // Каталог: подкатегории и карточки внутри них ([cat]/[subcat][/product]) — отдельный тип
  const segments = p.split("/").filter(Boolean);
  if (segments.length >= 2 && segments.length <= 3) return "subcategory";

  // Каталог: категории
  return "catalog";
};
