module.exports = ({ env }) => ({
  // ...
  email: {
    provider: 'sendgrid',
    providerOptions: {
      apiKey: env('SENDGRID_API_KEY'),
    },
    settings: {
      defaultFrom: 'ועדה פתוחה <noreply@sviva.net>',
      defaultReplyTo: 'ועדה פתוחה <noreply@sviva.net>',
    },
  },
});