'use strict';

const { prisma } = require('../config/prisma');

async function list(userId, { page, limit, status, priority, search, sortBy, order }) {
  const where = { userId };
  if (status) where.status = status;
  if (priority) where.priority = priority;
  if (search) {
    // Prisma menggunakan ILIKE untuk contains; perlakukan %, _, dan backslash sebagai teks.
    const text = { contains: search.replace(/[\\%_]/g, '\\$&'), mode: 'insensitive' };
    where.OR = [{ title: text }, { description: text }];
  }
  const [data, total] = await Promise.all([
    prisma.task.findMany({
      where, orderBy: [{ [sortBy]: order }, { id: order }], skip: (page - 1) * limit, take: limit,
    }),
    prisma.task.count({ where }),
  ]);
  return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}

function find(userId, id) {
  return prisma.task.findUniqueOrThrow({ where: { id, userId } });
}

function create(userId, input) {
  return prisma.task.create({ data: { ...input, userId } });
}

function update(userId, id, input) {
  return prisma.task.update({ where: { id, userId }, data: input });
}

function remove(userId, id) {
  return prisma.task.delete({ where: { id, userId }, select: { id: true } });
}

module.exports = { list, find, create, update, remove };
