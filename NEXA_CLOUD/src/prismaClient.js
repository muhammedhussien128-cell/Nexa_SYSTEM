const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

prisma.$use(async (params, next) => {
  const result = await next(params);
  
  // Intercept all write operations
  const writeActions = ['create', 'update', 'delete', 'updateMany', 'deleteMany', 'createMany'];
  
  if (writeActions.includes(params.action)) {
    // If socket.io is available globally, emit a generic db_update event
    if (global.io) {
      // You can add more granular events like `${params.model}_updated`
      global.io.emit('db_update', { model: params.model, action: params.action });
    }
  }
  
  return result;
});

module.exports = prisma;
