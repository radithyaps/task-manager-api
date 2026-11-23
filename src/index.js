'use strict';

const http = require('node:http');
const app = require('./app');
const { config, prisma } = require('./config/prisma');

const server = http.createServer({ requestTimeout: 30000, headersTimeout: 15000 }, app);

function shutdown() {
  if (!server.listening) return;
  const deadline = setTimeout(() => server.closeAllConnections(), 10000).unref();
  server.close(async () => {
    clearTimeout(deadline);
    await prisma.$disconnect();
  });
}

async function start() {
  await prisma.$connect();
  server.listen(config.PORT, config.HOST, () => {
    console.info(`Task Manager API mendengarkan di ${config.HOST}:${config.PORT}`);
    process.once('SIGINT', shutdown);
    process.once('SIGTERM', shutdown);
  });
}

async function startupFailed(error) {
  console.error('Server gagal dijalankan. Periksa port, koneksi database, dan migrasi.', {
    name: error.name, code: error.code ?? error.errorCode,
  });
  process.exitCode = 1;
  await prisma.$disconnect();
}

server.once('error', startupFailed);
start().catch(startupFailed);
