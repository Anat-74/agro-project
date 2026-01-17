import type { Core } from '@strapi/strapi';

export default (config: unknown, { strapi }: { strapi: Core.Strapi }) => {
  return async (ctx: any, next: () => Promise<void>) => {
    const originalPopulate = ctx.request.query.populate;

    if (!originalPopulate || Object.keys(originalPopulate).length === 0) {
      ctx.request.query.populate = {
        sections: {
          on: {
            'sliders.hero-slider': {
              populate: {
                image: {
                  fields: ['alternativeText', 'url', 'formats'],
                },
                bgImage: {
                  fields: ['alternativeText', 'url', 'formats'],
                  },
                  retinaBgImage: {
                  fields: ['alternativeText', 'url', 'formats'],
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
