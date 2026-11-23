'use strict';

const { randomUUID } = require('node:crypto');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const { config, prisma } = require('./config/prisma');
const { AppError, notFound, errorHandler } = require('./middlewares/errorMiddleware');
const { apiLimiter } = require('./middlewares/rateLimiter');
const authRoutes = require('./routes/authRoutes');
const taskRoutes = require('./routes/taskRoutes');

const app = express();
app.disable('x-powered-by');
app.set('trust proxy', config.TRUST_PROXY_HOPS);
app.set('query parser', 'simple');
app.use(helmet());
app.use((req, res, next) => {
  res.set({ 'X-Request-Id': randomUUID(), 'Cache-Control': 'no-store' });
  next();
});
morgan.token('route', (req) => req.route ? `${req.baseUrl}${req.route.path}` : '(unmatched)');
app.use(morgan(':method :route :status :response-time ms :res[x-request-id]'));

app.use(cors({
  origin(origin, callback) {
    if (!origin || config.CORS_ORIGIN.includes(origin)) return callback(null, true);
    return callback(new AppError(403, 'Origin tidak diizinkan.'));
  },
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Authorization', 'Content-Type'],
  exposedHeaders: ['Location', 'X-Request-Id', 'RateLimit', 'Retry-After'],
}));

app.get('/health', (req, res) => res.json({ status: 'ok' }));
app.get('/health/ready', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch {
    throw new AppError(503, 'Database belum tersedia.');
  }
  res.json({ status: 'ready' });
});

app.use('/api', apiLimiter, express.json({ limit: '16kb', type: ['application/json', 'application/*+json'] }));
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use(notFound);
app.use(errorHandler);

module.exports = app;
