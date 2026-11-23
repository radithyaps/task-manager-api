'use strict';

const { accessUserId } = require('../services/authService');
const { AppError } = require('./errorMiddleware');

function authenticate(req, res, next) {
  const match = /^Bearer ([^\s]+)$/i.exec(req.get('Authorization') ?? '');
  try {
    if (!match || match[1].length > 4096) throw new AppError(401, 'Bearer access token diperlukan.');
    res.locals.userId = accessUserId(match[1]);
  } catch (error) {
    if (error.status === 401) res.set('WWW-Authenticate', 'Bearer realm="tasks"');
    return next(error);
  }
  return next();
}

module.exports = { authenticate };
