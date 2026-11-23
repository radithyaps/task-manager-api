'use strict';

const tasks = require('../services/taskService');

async function list(req, res) {
  const { userId, input } = res.locals;
  const { data, meta } = await tasks.list(userId, input.query);
  res.json({ success: true, data, meta });
}

async function find(req, res) {
  const { userId, input } = res.locals;
  const data = await tasks.find(userId, input.params.id);
  res.json({ success: true, data });
}

async function create(req, res) {
  const { userId, input } = res.locals;
  const data = await tasks.create(userId, input.body);
  res.location(`/api/tasks/${data.id}`).status(201).json({ success: true, data });
}

async function update(req, res) {
  const { userId, input } = res.locals;
  const data = await tasks.update(userId, input.params.id, input.body);
  res.json({ success: true, data });
}

async function remove(req, res) {
  const { userId, input } = res.locals;
  const data = await tasks.remove(userId, input.params.id);
  res.json({ success: true, data });
}

module.exports = { list, find, create, update, remove };
