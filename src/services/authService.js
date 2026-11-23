'use strict';

const { randomBytes } = require('node:crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { z } = require('zod');
const { config, prisma } = require('../config/prisma');
const { AppError } = require('../middlewares/errorMiddleware');

const issuer = 'task-manager-api';
const tokenLifetime = 7 * 24 * 60 * 60; // 7 hari, dalam detik.
const publicUser = { id: true, name: true, email: true, createdAt: true, updatedAt: true };
const claimsSchema = z.object({ sub: z.uuid(), exp: z.number().int() });
// Login tetap menjalankan bcrypt ketika email tidak dikenal.
const dummyHash = bcrypt.hashSync(randomBytes(32).toString('hex'), config.BCRYPT_SALT_ROUNDS);

async function register({ name, email, password }) {
  const passwordHash = await bcrypt.hash(password, config.BCRYPT_SALT_ROUNDS);
  const user = await prisma.user.create({
    data: { name, email, passwordHash },
    select: publicUser,
  });
  return { user };
}

async function login({ email, password }) {
  const account = await prisma.user.findUnique({ where: { email }, select: { ...publicUser, passwordHash: true } });
  const matches = await bcrypt.compare(password, account?.passwordHash ?? dummyHash);
  if (!account || !matches) throw new AppError(401, 'Email atau password salah.');

  const { passwordHash, ...user } = account;
  const accessToken = jwt.sign({}, config.JWT_SECRET, {
    algorithm: 'HS256', issuer, subject: user.id, expiresIn: tokenLifetime,
  });
  return { user, accessToken, tokenType: 'Bearer', expiresIn: tokenLifetime };
}

function accessUserId(token) {
  try {
    const claims = jwt.verify(token, config.JWT_SECRET, { algorithms: ['HS256'], issuer });
    const result = claimsSchema.safeParse(claims);
    if (result.success) return result.data.sub;
  } catch (error) {
    if (!(error instanceof jwt.JsonWebTokenError)) throw error;
  }
  throw new AppError(401, 'Token tidak valid atau sudah kedaluwarsa. Silakan login kembali.');
}

function profile(userId) {
  return prisma.user.findUniqueOrThrow({ where: { id: userId }, select: publicUser });
}

module.exports = { register, login, accessUserId, profile };
