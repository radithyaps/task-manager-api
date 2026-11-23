'use strict';

const { z } = require('zod');

const email = z.string().trim().toLowerCase().pipe(z.email().max(254));
// bcrypt memproses paling banyak 72 byte, bukan 72 karakter Unicode.
const password = z.string().min(1).refine((value) => Buffer.byteLength(value, 'utf8') <= 72, {
  message: 'Password maksimal 72 byte UTF-8.',
});

const registerBody = z.strictObject({
  name: z.string().trim().min(2).max(80).regex(/^[^\u0000]*$/u, 'Nama mengandung karakter yang tidak didukung.'),
  email,
  password: password.min(12),
});

const loginBody = z.strictObject({ email, password });

module.exports = { registerBody, loginBody };
