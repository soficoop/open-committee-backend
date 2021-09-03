module.exports = ({ env }) => ({
  host: env('HOST', '0.0.0.0'),
  port: env.int('PORT', 1337),
  url: env('URL_PREFIX', ''),
  templatesDir: 'public/templates/',
  appUrl: env('APP_URL', 'https://app.sviva.net'),
  strapiUrl: env('STRAPI_URL', 'https://admin.oc.soficoop.com'),
  cron: {
    enabled: env.bool('CRON_ENABLED', true),
  },
  admin: {
    auth: {
      url: '/admin',
      secret: env('ADMIN_JWT_SECRET', 'someSecretKey'),
    },
  },
});