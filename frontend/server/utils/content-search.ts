import { $fetch } from "ofetch";

/**
 * Полнотекстовый поиск по материалам проекта: статьи блога, растения («Посадка»),
 * продукты («Заготовки») и FAQ разделов. Используется инструментом content_search
 * чат-ассистента как опора для ответа и источник ссылок.
 *
 * Поиск идёт по ключевым словам (токенам) через `$containsi` — иначе запрос
 * целой фразой («как варить варенье из яблок?») не совпал бы ни с одним текстом.
 */

export interface ContentHit {
  /** Заголовок материала (для блока «Источники») */
  title: string;
  /** Абсолютный путь на сайте (NuxtLink) */
  url: string;
  /** Короткая выдержка (без HTML) */
  snippet: string;
  type: "article" | "crop" | "preserve" | "faq";
}

// Короткий кэш результатов в рамках процесса Nitro: одинаковые частые запросы
// не бьют по Strapi повторно (content_search делает 4+ запроса за вызов).
const CACHE_TTL = 5 * 60_000;
const CACHE_MAX = 100;
const cache = new Map<string, { data: ContentHit[]; expiresAt: number }>();

const sweepCache = () => {
  const now = Date.now();
  for (const [key, entry] of cache) {
    if (entry.expiresAt < now) cache.delete(key);
  }
  if (cache.size > CACHE_MAX) {
    for (const key of cache.keys()) {
      if (cache.size <= CACHE_MAX) break;
      cache.delete(key);
    }
  }
};

// Частые слова, которые не несут смысла для поиска
const STOP_WORDS = new Set([
  "как", "что", "где", "когда", "зачем", "почему", "какой", "какая", "какие",
  "для", "или", "это", "чем", "при", "про", "все", "всё", "его", "его", "она",
  "они", "мы", "вы", "мне", "меня", "можно", "нужно", "надо", "лучше", "быть",
  "есть", "свой", "свои", "очень", "если", "чтобы", "также", "тоже", "the",
  "and", "for", "with", "how", "what", "when",
]);

const stripHtml = (value?: string | null): string =>
  (value || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const cut = (value: string, max = 180): string =>
  value.length > max ? `${value.slice(0, max).trim()}…` : value;

/** Ключевые слова запроса (до 3), по которым ищем материалы */
export const tokenize = (query: string): string[] => {
  const words = (query || "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, " ")
    .split(/\s+/)
    .filter((word) => word.length >= 4 && !STOP_WORDS.has(word));
  const unique = [...new Set(words)];
  return unique.slice(0, 3);
};

/** Плоские параметры `filters[$or][i][field][$containsi]` для набора полей и слов */
export const orFilterParams = (fields: string[], tokens: string[]) => {
  const params: Record<string, string> = {};
  let index = 0;
  for (const field of fields) {
    for (const token of tokens) {
      params[`filters[$or][${index}][${field}][$containsi]`] = token;
      index += 1;
    }
  }
  return params;
};

export async function searchContent(
  query: string,
  locale = "ru",
  limit = 5,
  strapiUrl?: string,
) {
  const q = (query || "").trim();
  if (!q) return { success: true, results: [] as ContentHit[] };

  const tokens = tokenize(q);
  if (tokens.length === 0) tokens.push(q.toLowerCase());

  const cacheKey = `${locale}|${tokens.join(",")}|${limit}`;
  const cached = cache.get(cacheKey);
  if (cached && Date.now() < cached.expiresAt) {
    return { success: true, results: cached.data };
  }

  const {
    strapi: { url: cfgUrl, token },
  } = useRuntimeConfig();
  const baseUrl = strapiUrl || cfgUrl || "http://127.0.0.1:1337";
  const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
  const hits: ContentHit[] = [];

  // 1. Статьи блога (рецепты и материалы разделов)
  try {
    const res: any = await $fetch(`${baseUrl}/api/blogs`, {
      headers,
      params: {
        locale,
        ...orFilterParams(["title"], tokens),
        "fields[0]": "title",
        "fields[1]": "slug",
        "fields[2]": "content",
        "pagination[pageSize]": limit,
      },
    });
    for (const item of res?.data || []) {
      hits.push({
        title: item.title,
        url: `/${locale}/blog/${item.slug}`,
        snippet: cut(stripHtml(item.content)),
        type: "article",
      });
    }
  } catch (error) {
    console.error("content-search blog error:", error);
  }

  // 2. Растения — страницы «Посадки»
  try {
    const res: any = await $fetch(`${baseUrl}/api/crops`, {
      headers,
      params: {
        locale,
        ...orFilterParams(["name", "shortDescription", "description"], tokens),
        "fields[0]": "name",
        "fields[1]": "slug",
        "fields[2]": "shortDescription",
        "fields[3]": "description",
        "pagination[pageSize]": limit,
      },
    });
    for (const item of res?.data || []) {
      hits.push({
        title: item.name,
        url: `/${locale}/posadka-i-urozhay/${item.slug}`,
        snippet: cut(stripHtml(item.shortDescription || item.description)),
        type: "crop",
      });
    }
  } catch (error) {
    console.error("content-search crops error:", error);
  }

  // 3. Продукты «Заготовок» — ведут на страницу раздела (отдельных страниц нет)
  try {
    const res: any = await $fetch(`${baseUrl}/api/preserves`, {
      headers,
      params: {
        locale,
        ...orFilterParams(["name", "shortDescription", "description"], tokens),
        "fields[0]": "name",
        "fields[1]": "shortDescription",
        "fields[2]": "description",
        "pagination[pageSize]": limit,
      },
    });
    for (const item of res?.data || []) {
      hits.push({
        title: item.name,
        url: `/${locale}/zagotovki`,
        snippet: cut(stripHtml(item.shortDescription || item.description)),
        type: "preserve",
      });
    }
  } catch (error) {
    console.error("content-search preserves error:", error);
  }

  // 4. FAQ разделов (компоненты faq — фильтруем по словам локально)
  const faqSections: Array<[string, string]> = [
    ["calculator-page", `/${locale}/posadka-i-urozhay`],
    ["preserve-page", `/${locale}/zagotovki`],
  ];
  for (const [endpoint, url] of faqSections) {
    try {
      const res: any = await $fetch(`${baseUrl}/api/${endpoint}`, {
        headers,
        params: { locale, "populate[faq]": true },
      });
      for (const faq of res?.data?.faq || []) {
        const haystack = `${faq.question || ""} ${faq.answer || ""}`.toLowerCase();
        if (tokens.some((token) => haystack.includes(token))) {
          hits.push({
            title: faq.question,
            url,
            snippet: cut(stripHtml(faq.answer)),
            type: "faq",
          });
        }
      }
    } catch (error) {
      console.error(`content-search ${endpoint} error:`, error);
    }
  }

  // Дедупликация по url+title, приоритет — более ранние (статьи/растения)
  const seen = new Set<string>();
  const results = hits.filter((hit) => {
    const key = `${hit.url}|${hit.title}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  const limited = results.slice(0, limit);
  cache.set(cacheKey, { data: limited, expiresAt: Date.now() + CACHE_TTL });
  sweepCache();

  return { success: true, results: limited };
}
