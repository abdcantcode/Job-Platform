import dotenv from 'dotenv';

dotenv.config({ quiet: true });

const required = ['MONGO_URI', 'JWT_SECRET'];
const missing = required.filter((key) => !process.env[key]);

if (missing.length) {
  console.error(
    `\nMissing required environment variables: ${missing.join(', ')}\n` +
      'Add them to backend/.env (see .env.example) and restart.\n'
  );
  process.exit(1);
}

const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT) || 5000,
  mongoUri: process.env.MONGO_URI,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',

  // Comma-separated list of allowed frontend origins.
  clientUrls: (process.env.CLIENT_URL || 'http://localhost:5173')
    .split(',')
    .map((url) => url.trim().replace(/\/$/, ''))
    .filter(Boolean),

  smtp: {
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    from: process.env.MAIL_FROM || process.env.SMTP_USER,
  },

  reminder: {
    cron: process.env.REMINDER_CRON || '0 9 * * *',
    timezone: process.env.REMINDER_TZ || 'Asia/Kolkata',
    staleDays: Number.isFinite(Number(process.env.REMINDER_STALE_DAYS))
      ? Number(process.env.REMINDER_STALE_DAYS)
      : 7,
  },
};

export default env;
