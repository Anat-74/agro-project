import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import * as z from "zod/v4";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

/**
 * DeepSeek Search & Fetch MCP.
 *
 * Два инструмента:
 *  - search — веб-поиск (движок DeepSeek), до 50 результатов; summary рассчитан на модель.
 *  - fetch  — страница как Markdown.
 *
 * Ключ: DEEPSEEK_API_KEY из окружения, иначе из frontend/.env (ключ не логируется).
 * Кэш ответов — 15 минут (поиск и страницы), максимум 100 записей.
 * Ретраи: 408/429/5xx — до 3 попыток с backoff; остальные 4xx не повторяем.
 *
 * Доки: https://api-docs.deepseek.com/guides/search/
 */

const BASE_URL = "https://api.deepseek.com";
const CACHE_TTL_MS = 15 * 60 * 1000;
const CACHE_MAX = 100;
const CONTENT_LIMIT = 6000; // символов на один результат в search
const PAGE_LIMIT = 30000; // символов в fetch

const __dirname = dirname(fileURLToPath(import.meta.url));

function loadApiKey() {
  if (process.env.DEEPSEEK_API_KEY) return process.env.DEEPSEEK_API_KEY.trim();
  try {
    const envPath = resolve(__dirname, "../../frontend/.env");
    const text = readFileSync(envPath, "utf8");
    const m = text.match(/^\s*DEEPSEEK_API_KEY\s*=\s*(.+?)\s*$/m);
    if (m) return m[1].replace(/^["']|["']$/g, "");
  } catch {
    /* .env может отсутствовать — вернём пустую строку */
  }
  return "";
}

const cache = new Map();

function cacheGet(key) {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expires) {
    cache.delete(key);
    return null;
  }
  return entry.value;
}

function cacheSet(key, value) {
  if (cache.size >= CACHE_MAX) {
    const oldest = cache.keys().next().value;
    if (oldest !== undefined) cache.delete(oldest);
  }
  cache.set(key, { value, expires: Date.now() + CACHE_TTL_MS });
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function callApi(path, body) {
  const key = loadApiKey();
  if (!key) {
    throw new Error("DEEPSEEK_API_KEY не найден: задайте env или добавьте в frontend/.env");
  }

  let lastError = null;

  for (let attempt = 0; attempt < 3; attempt++) {
    let res;
    try {
      res = await fetch(`${BASE_URL}${path}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });
    } catch (err) {
      lastError = new Error(`Сеть недоступна: ${err.message}`);
      await sleep(700 * (attempt + 1));
      continue;
    }

    if (res.ok) return res.json();

    const status = res.status;
    let detail = "";
    try {
      const parsed = await res.json();
      detail = parsed?.error?.message || "";
    } catch {
      /* тело может быть не JSON */
    }

    const message = `DeepSeek API ${status}${detail ? `: ${detail}` : ""}`;

    // Повторяем только временные ошибки
    if (status === 408 || status === 429 || status >= 500) {
      lastError = new Error(message);
      await sleep(700 * (attempt + 1));
      continue;
    }

    throw new Error(message);
  }

  throw lastError ?? new Error("DeepSeek API: неизвестная ошибка");
}

function buildQuery({ query, site, lang, after }) {
  let q = query.trim();

  if (site) {
    const sites = site
      .split(/[,\s]+/)
      .map((s) => s.trim())
      .filter(Boolean)
      .map((s) => `site:${s}`)
      .join(" OR ");
    if (sites) q += ` ${sites}`;
  }
  if (lang) q += ` lang:${lang.replace(/\s+/g, "")}`;
  if (after) q += ` after:${after.trim()}`;

  return q;
}

function truncate(text, limit) {
  if (typeof text !== "string" || text.length <= limit) return text;
  return `${text.slice(0, limit)}\n\n… [обрезано: ${text.length - limit} символов]`;
}

function textResult(payload) {
  return {
    content: [{ type: "text", text: JSON.stringify(payload, null, 2) }],
  };
}

function errorResult(err) {
  return {
    content: [{ type: "text", text: `Ошибка: ${err?.message || String(err)}` }],
    isError: true,
  };
}

const server = new McpServer({
  name: "deepseek-search",
  version: "1.0.0",
});

server.registerTool(
  "search",
  {
    description:
      "Веб-поиск (движок DeepSeek). Возвращает title, url, summary (600–800 симв., для модели), " +
      "snippet, date, authority (0–4, ≥3 — авторитетный), rerank_score (0–3, ≥1.5 — качественный). " +
      "Сначала используй MCP документации (nuxt-docs, vue-docs); поиск — когда там нет ответа. " +
      "Операторы query: site:, lang:, after:, before: — можно передавать через параметры.",
    inputSchema: {
      query: z.string().min(1).max(128).describe("Поисковый запрос (1–128 символов)"),
      count: z
        .number()
        .int()
        .min(1)
        .max(50)
        .default(5)
        .describe("Сколько результатов вернуть (1–50, по умолчанию 5)"),
      need_content: z
        .boolean()
        .default(false)
        .describe("Вернуть полный текст страниц в content (по умолчанию false)"),
      site: z
        .string()
        .optional()
        .describe("Ограничить домены: nuxt.com или 'nuxt.com github.com' (объединяются через OR)"),
      lang: z.string().optional().describe("Языки через запятую: en, ru, zh"),
      after: z.string().optional().describe("Дата публикации после: 2025 или 2025-01-01"),
    },
  },
  async ({ query, count, need_content, site, lang, after }) => {
    try {
      const q = buildQuery({ query, site, lang, after });
      if (!q) throw new Error("Пустой запрос");

      const cacheKey = `search:${q}:${count}:${need_content}`;
      const cached = cacheGet(cacheKey);

      const data = cached ?? (await callApi("/v1/tools/search", {
        query: q,
        count,
        need_content,
      }));
      if (!cached) cacheSet(cacheKey, data);

      const results = (data?.results ?? []).map((r) => ({
        title: r.title,
        url: r.url,
        summary: r.summary || r.snippet || "",
        date: r.date ?? null,
        authority: r.authority ?? -1,
        rerank_score: r.rerank_score ?? null,
        site_name: r.site_name ?? null,
        ...(need_content && r.content
          ? { content: truncate(r.content, CONTENT_LIMIT) }
          : {}),
      }));

      return textResult({ query: q, count: results.length, results });
    } catch (err) {
      return errorResult(err);
    }
  }
);

server.registerTool(
  "fetch",
  {
    description:
      "Получить веб-страницу и вернуть её содержимое как Markdown (DeepSeek Fetch). " +
      "URL http/https без логина/пароля. Не работает для SPA/paywall/закрытых сайтов.",
    inputSchema: {
      url: z.string().describe("URL страницы (http или https)"),
    },
  },
  async ({ url }) => {
    try {
      let parsed;
      try {
        parsed = new URL(url);
      } catch {
        throw new Error("Некорректный URL");
      }
      if (!["http:", "https:"].includes(parsed.protocol)) {
        throw new Error("Поддерживаются только http/https URL");
      }
      if (parsed.username || parsed.password) {
        throw new Error("URL не должен содержать логин/пароль");
      }

      const cacheKey = `fetch:${parsed.toString()}`;
      const cached = cacheGet(cacheKey);
      const data = cached ?? (await callApi("/v1/tools/fetch", { url: parsed.toString() }));
      if (!cached) cacheSet(cacheKey, data);

      return textResult({
        url: parsed.toString(),
        title: data?.title ?? "",
        content: truncate(data?.content ?? "", PAGE_LIMIT),
      });
    } catch (err) {
      return errorResult(err);
    }
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);
