'use strict';

const { Router } = require('express');
const auth = require('../controllers/authController');
const { authLimiter } = require('../middlewares/rateLimiter');
const { validate } = require('../middlewares/validateMiddleware');
const { authenticate } = require('../middlewares/authMiddleware');
const { registerBody, loginBody } = require('../validators/authValidator');

const router = Router();
router.post('/register', authLimiter, validate({ body: registerBody }), auth.register);
router.post('/login', authLimiter, validate({ body: loginBody }), auth.login);
router.get('/me', authenticate, validate(), auth.me);

module.exports = router;
