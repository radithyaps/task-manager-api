'use strict';

const { rateLimit } = require('express-rate-limit');
const { config } = require('../config/prisma');
const { AppError } = require('./errorMiddleware');

function createLimiter(identifier, limit) {
  return rateLimit({
    identifier,
    windowMs: config.RATE_LIMIT_WINDOW_MS,
    limit,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    handler: (req, res, next) => next(new AppError(429, 'Terlalu banyak request. Coba lagi nanti.')),
  });
}

const apiLimiter = createLimiter('api', config.RATE_LIMIT_MAX);
const authLimiter = createLimiter('auth', config.AUTH_RATE_LIMIT_MAX);

module.exports = { apiLimiter, authLimiter };
