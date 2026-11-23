'use strict';

class AppError extends Error {
  constructor(status, message, errors = []) {
    super(message);
    this.name = 'AppError';
    this.status = status;
    this.errors = errors;
  }
}

function notFound(req, res, next) {
  next(new AppError(404, 'Endpoint tidak ditemukan.'));
}

function publicError(err) {
  if (err instanceof AppError) return err;
  if (err.type === 'entity.parse.failed') return new AppError(400, 'Body JSON tidak valid.');
  if (err.type === 'entity.too.large') return new AppError(413, 'Body request terlalu besar.');
  if (['charset.unsupported', 'encoding.unsupported'].includes(err.type)) {
    return new AppError(415, 'Encoding request tidak didukung.');
  }
  if (['request.aborted', 'request.size.invalid'].includes(err.type) || err instanceof URIError) {
    return new AppError(400, 'Request tidak valid.');
  }
  if (err.code === 'P2025') return new AppError(404, 'Data tidak ditemukan.');
  if (err.code === 'P2002' && err.meta?.target?.includes('email')) {
    return new AppError(409, 'Email sudah terdaftar.');
  }
  if (['P1001', 'P1002', 'P1017', 'P2024'].includes(err.code) || err.name === 'PrismaClientInitializationError') {
    return new AppError(503, 'Database belum tersedia.');
  }
  return new AppError(500, 'Terjadi kesalahan internal.');
}

function errorHandler(err, req, res, next) {
  if (res.headersSent) return next(err);
  const error = publicError(err);
  if (error.status >= 500) {
    console.error('request_failed', { requestId: res.get('X-Request-Id'), name: err.name, code: err.code });
  }
  return res.status(error.status).json({ success: false, message: error.message, errors: error.errors });
}

module.exports = { AppError, notFound, errorHandler };
