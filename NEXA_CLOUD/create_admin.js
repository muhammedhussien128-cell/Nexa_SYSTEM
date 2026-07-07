const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function seed() {
  const adminExists = await prisma.systemUser.findUnique({ where: { username: 'admin' }});
  if (!adminExists) {
    const hashedPassword = await bcrypt.hash('Aa@5356313', 10);
    await prisma.systemUser.create({
      data: {
        username: 'admin',
        password: hashedPassword,
        role: 'ADMIN',
        permissions: '[]'
      }
    });
    console.log('Admin user created successfully');
  } else {
    console.log('Admin user already exists');
  }
}

seed().catch(console.error).finally(() => prisma.$disconnect());
