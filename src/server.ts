import http from 'http';
import app from './app';
import { env } from './config/env';
import prisma from './config/database';
import cache from './config/redis';
import fs from 'fs';
import path from 'path';

const server = http.createServer(app);

// Ensure uploads directory exists
const uploadsDir = path.resolve(env.UPLOAD_DIR);
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

async function start() {
  try {
    // Test database connection
    await prisma.$connect();
    console.log('✅ Database connected');

    // Try Redis connection (optional)
    await cache.connect();

    // Start server
    server.listen(env.PORT, () => {
      console.log(`
╔══════════════════════════════════════════════════╗
║     People's Voice Initiative — API Server       ║
║──────────────────────────────────────────────────║
║  Environment : ${env.NODE_ENV.padEnd(33)}║
║  Port        : ${String(env.PORT).padEnd(33)}║
║  Client URL  : ${env.CLIENT_URL.padEnd(33)}║
╚══════════════════════════════════════════════════╝
      `);
    });
  } catch (err) {
    console.error('❌ Failed to start server:', err);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n⏳ Shutting down gracefully...');
  await prisma.$disconnect();
  cache.disconnect();
  server.close(() => {
    console.log('✅ Server shut down');
    process.exit(0);
  });
});

process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  cache.disconnect();
  server.close(() => process.exit(0));
});

start();
