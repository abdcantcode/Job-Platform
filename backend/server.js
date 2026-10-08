import app from './src/app.js';
import env from './src/config/env.js';
import { connectDB, disconnectDB } from './src/config/db.js';
import { startReminderJob } from './src/services/reminder.service.js';

const start = async () => {
  await connectDB();

  const server = app.listen(env.port, () => {
    console.log(`API listening on http://localhost:${env.port} (${env.nodeEnv})`);
  });

  const reminderTask = startReminderJob();

  const shutdown = async (signal) => {
    console.log(`\n${signal} received, shutting down...`);
    reminderTask?.stop();
    server.close(async () => {
      await disconnectDB();
      process.exit(0);
    });
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
};

start().catch((error) => {
  console.error('Failed to start the server:', error.message);
  process.exit(1);
});
