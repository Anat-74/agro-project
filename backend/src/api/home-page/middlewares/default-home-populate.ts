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
                  backgroundImage: {
                  populate: {
                    retinaBgImageAvif: {
                      fields: ['alternativeText', 'url'],
                    },
                    baseBgImageWebp: {
                      fields: ['alternativeText', 'url'],
                    },
                  }
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
         },
         featuredProducts: {
           on: {
             "sections.featured-products": {
                 populate: {
                  image: {
                  fields: ['alternativeText', 'url'],
                  },
                  backgroundImage: {
                  populate: {
                    retinaBgImageAvif: {
                      fields: ['alternativeText', 'url'],
                    },
                    baseBgImageWebp: {
                      fields: ['alternativeText', 'url'],
                    },
                  }
                },
                   products: {
                     //  fields: ['name', 'price', 'slug','isAvailable', 'isDiscount', 'locale'],
                   populate: {
                     image: {
                       fields: ['alternativeText', 'url']
                         },
                     category: {
                     fields: ['name', 'slug']
                     },
                   }
                 }
               },
             },
           },
         }


      };
    }

    await next();
  };
};
