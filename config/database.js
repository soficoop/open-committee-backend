module.exports = ({ env }) => ({
  defaultConnection: 'default',
  connections: {
    default: {
      connector: 'mongoose',
      settings: {
        uri: env('DATABASE_URI', 'strapi'),
      },
      options: {
        ssl: env('DATABASE_SSL'),
      },
    },
  },
});