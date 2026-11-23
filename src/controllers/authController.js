'use strict';

const auth = require('../services/authService');

async function register(req, res) {
  const data = await auth.register(res.locals.input.body);
  res.status(201).json({ success: true, data });
}

async function login(req, res) {
  const data = await auth.login(res.locals.input.body);
  res.json({ success: true, data });
}

async function me(req, res) {
  const user = await auth.profile(res.locals.userId);
  res.json({ success: true, data: { user } });
}

module.exports = { register, login, me };
