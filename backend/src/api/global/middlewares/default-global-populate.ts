import type { Core } from "@strapi/strapi";

export default (config: unknown, { strapi }: { strapi: Core.Strapi }) => {
  return async (ctx: any, next: () => Promise<void>) => {
    const originalPopulate = ctx.request.query.populate;

    if (!originalPopulate || Object.keys(originalPopulate).length === 0) {
      ctx.request.query.populate = {
        footer: {
          populate: {
            logo: {
              fields: ["alternativeText", "url", "formats"],
            },
          },
        },
        socials: {
          populate: {
            icon: {
              fields: ["alternativeText", "url", "formats"],
            },
          },
        },
        legal: true,
        phones: true,
        email: true,
        header: {
          populate: {
            navigation: {
              on: {
                "layout.link": {
                  fields: ["label", "url"],
                },
              },
            },
          },
        },
      };
    }

    await next();
  };
};
