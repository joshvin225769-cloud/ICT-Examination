import mongoose from 'mongoose';
import { createApp } from './app.js';
import { getConfig } from './config/env.js';
import { connectDatabase, provisionAdmin } from './config/database.js';

async function start() {
  const config = getConfig();
  await connectDatabase(config.mongoUri);
  await provisionAdmin();
  const app = createApp(config);
  const server = app.listen(config.port, () => console.log(`CampusDesk API listening on port ${config.port}`));
  server.on('error', async error => { console.error('Server startup failed:', error.message); await mongoose.disconnect(); process.exitCode = 1; });
  let shuttingDown = false;
  const shutdown = () => {
    if (shuttingDown) return;
    shuttingDown = true;
    const timeout = setTimeout(() => process.exit(1), 10000);
    timeout.unref();
    server.close(async () => { await mongoose.disconnect(); clearTimeout(timeout); });
  };
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}
start().catch(async error => { console.error('Unable to start CampusDesk:', error.message); await mongoose.disconnect(); process.exitCode = 1; });
