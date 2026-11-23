'use strict';

const { z } = require('zod');
const { AppError } = require('./errorMiddleware');

const empty = z.strictObject({});

function validate({ body, params = empty, query = empty } = {}) {
  const schema = z.object({ body: body ?? empty, params, query });

  return (req, res, next) => {
    if (body && !req.is(['application/json', 'application/*+json'])) {
      return next(new AppError(415, 'Gunakan Content-Type: application/json dengan body JSON.'));
    }
    const result = schema.safeParse({
      body: body ? req.body : (req.body ?? {}),
      params: req.params,
      query: req.query,
    });
    if (!result.success) {
      const fields = result.error.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      }));
      return next(new AppError(400, 'Input tidak valid.', fields));
    }
    res.locals.input = result.data;
    return next();
  };
}

module.exports = { validate };
