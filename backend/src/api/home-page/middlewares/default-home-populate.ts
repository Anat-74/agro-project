import type { Core } from '@strapi/strapi';

export default (config: unknown, { strapi }: { strapi: Core.Strapi }) => {
  return async (ctx: any, next: () => Promise<void>) => {
    const originalPopulate = ctx.request.query.populate;

    if (!originalPopulate || Object.keys(originalPopulate).length === 0) {
      ctx.request.query.populate = {
        heroSlider: {
          on: {
            "sliders.hero-slider": {
              populate: {
                image: {
                  fields: ['alternativeText', 'url'],
                },
                  retinaBgImage: {
                  fields: ['alternativeText', 'url'],
                  },
                  fallbackBgImage: {
                  fields: ['alternativeText', 'url'],
                },
               },
              },
            },
         },
         heroGrids: {
            on: {
               "sections.hero-grids": {
               populate: {
                  icons: {
                     fields: ['alternativeText', 'url'],
                     }
                  }
               }
            }
         }

      };
    }

    await next();
  };
};
