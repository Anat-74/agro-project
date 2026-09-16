// ВРЕМЕННЫЙ диагностический эндпоинт (удалить после диагностики).
// Показывает, какой Strapi-URL/токен видит сервер приложения и что происходит
// при серверном запросе (прод-белый экран: SSR-запросы падают с 500).
export default defineEventHandler(async () => {
  const cfg = useRuntimeConfig();
  const url = cfg?.strapi?.url ?? null;
  const token = cfg?.strapi?.token ?? null;

  const out: Record<string, unknown> = {
    strapiUrl: url,
    tokenPresent: Boolean(token),
    tokenLength: token ? String(token).length : 0,
    publicStrapiUrl: (cfg as any)?.public?.strapi?.url ?? null,
    siteUrl: (cfg as any)?.public?.siteUrl ?? null,
  };

  if (url) {
    try {
      const res: any = await $fetch(`${url}/api/global?filters[locale][$eq]=ru`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      out.fetchOk = true;
      out.dataPresent = Boolean(res?.data);
    } catch (e: any) {
      out.fetchOk = false;
      out.errorMessage = e?.message ?? String(e);
      out.errorStatus = e?.response?.status ?? e?.statusCode ?? null;
      out.errorName = e?.name ?? null;
      out.cause = e?.cause?.message ?? null;
    }
  }

  return out;
});
