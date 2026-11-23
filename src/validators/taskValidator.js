'use strict';

const { z } = require('zod');
const { TaskStatus, TaskPriority } = require('@prisma/client');

const status = z.enum(TaskStatus);
const priority = z.enum(TaskPriority);
const text = z.string().trim().regex(/^[^\u0000]*$/u, 'Teks mengandung karakter yang tidak didukung.');
const taskParams = z.strictObject({ id: z.uuid() });
const fields = {
  title: text.min(1).max(200),
  description: text.max(2000).nullable(),
  status,
  priority,
  dueDate: z.iso.datetime({ offset: true }).transform((value) => new Date(value)).pipe(z.date()).nullable(),
};

const createBody = z.strictObject({
  title: fields.title,
  description: fields.description.optional(),
  status: status.optional(),
  priority: priority.optional(),
  dueDate: fields.dueDate.optional(),
});
const updateBody = z.strictObject(fields).partial().refine((value) => Object.keys(value).length > 0, {
  message: 'Kirim minimal satu field untuk diubah.',
});

function pageNumber(max, fallback) {
  return z.string().regex(/^[1-9]\d*$/).transform(Number)
    .pipe(z.number().int().min(1).max(max)).default(fallback);
}

const listQuery = z.strictObject({
  page: pageNumber(10000, 1),
  limit: pageNumber(100, 20),
  status: status.optional(),
  priority: priority.optional(),
  search: text.min(1).max(200).optional(),
  sortBy: z.enum(['createdAt', 'updatedAt', 'dueDate', 'title', 'priority', 'status']).default('createdAt'),
  order: z.enum(['asc', 'desc']).default('desc'),
});

module.exports = { taskParams, createBody, updateBody, listQuery };
