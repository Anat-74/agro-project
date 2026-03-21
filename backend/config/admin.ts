export default ({ env }) => ({
  auth: {
    secret: env('ADMIN_JWT_SECRET'),
    // Новая конфигурация сессий для Strapi 5.40.0+
    sessions: {
      maxRefreshTokenLifespan: env.int('ADMIN_SESSION_MAX_REFRESH_LIFESPAN', 60 * 60 * 24 * 30), // 30 дней
      maxSessionLifespan: env.int('ADMIN_SESSION_MAX_LIFESPAN', 60 * 60 * 24 * 7), // 7 дней
    },
  },
  apiToken: {
    salt: env('API_TOKEN_SALT'),
  },
  transfer: {
    token: {
      salt: env('TRANSFER_TOKEN_SALT', 'anotherRandomLongString'),
    },
  },
  flags: {
    nps: env.bool('FLAG_NPS', true),
    promoteEE: env.bool('FLAG_PROMOTE_EE', true),
  },
});
