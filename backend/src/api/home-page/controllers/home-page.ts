/**
 * home-page controller
 */

import { factories } from "@strapi/strapi";

export default factories.createCoreController(
  "api::home-page.home-page",
  ({ strapi }) => ({
    // Можно добавить кастомные методы, если нужно
    // Но в данном случае используем стандартные методы из core controller
  })
);
