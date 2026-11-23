'use strict';

const { Router } = require('express');
const tasks = require('../controllers/taskController');
const { authenticate } = require('../middlewares/authMiddleware');
const { validate } = require('../middlewares/validateMiddleware');
const { taskParams, createBody, updateBody, listQuery } = require('../validators/taskValidator');

const router = Router();
router.use(authenticate);
router.get('/', validate({ query: listQuery }), tasks.list);
router.post('/', validate({ body: createBody }), tasks.create);
router.get('/:id', validate({ params: taskParams }), tasks.find);
router.patch('/:id', validate({ params: taskParams, body: updateBody }), tasks.update);
router.delete('/:id', validate({ params: taskParams }), tasks.remove);

module.exports = router;
