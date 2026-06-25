export default ({ env }) => ({
  email: {
    config: {
      provider: env('SMTP_HOST') ? 'nodemailer' : 'nodemailer',
      providerOptions: env('SMTP_HOST')
        ? {
            host: env('SMTP_HOST'),
            port: parseInt(env('SMTP_PORT', '587'), 10),
            secure: false,
            auth: {
              user: env('SMTP_USER', ''),
              pass: env('SMTP_PASS', ''),
            },
          }
        : {
            jsonTransport: true,
          },
      settings: {
        defaultFrom: env('SMTP_FROM', 'noreply@agromarket.local'),
        defaultReplyTo: env('SMTP_FROM', 'noreply@agromarket.local'),
      },
    },
  },
});
