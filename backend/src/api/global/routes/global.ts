/**
 * global router
 */

import { factories } from "@strapi/strapi";

export default factories.createCoreRouter("api::global.global", {
  config: {
    find: {
      middlewares: ["api::global.default-global-populate"],
    },
    findOne: {
      middlewares: ["api::global.default-global-populate"],
    },
  },
});
