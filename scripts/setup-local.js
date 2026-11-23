'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { randomBytes } = require('node:crypto');

const root = path.resolve(__dirname, '..');
const password = randomBytes(32).toString('hex');
const databaseUrl = `postgresql://task_api:${password}@127.0.0.1:55432/task_manager`;
const settings = {
  JWT_SECRET: randomBytes(32).toString('hex'),
  POSTGRES_PASSWORD: password,
  DATABASE_URL: databaseUrl,
  DIRECT_URL: databaseUrl,
};

const template = fs.readFileSync(path.join(root, '.env.example'), 'utf8');
const contents = template.replace(/^(\w+)=$/gm, (line, key) => key in settings ? `${key}=${settings[key]}` : line);
try {
  fs.writeFileSync(path.join(root, '.env'), contents, { flag: 'wx', mode: 0o600 });
  console.log('.env lokal siap. Berikutnya: docker compose up --build -d --wait');
} catch (error) {
  if (error.code !== 'EEXIST') throw error;
  console.log('.env sudah ada; konfigurasi Anda tetap digunakan.');
}
