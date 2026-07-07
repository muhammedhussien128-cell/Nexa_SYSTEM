const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  const adminExists = await prisma.systemUser.findUnique({
    where: { username: 'admin' }
  });

  if (!adminExists) {
    const hashedPassword = await bcrypt.hash('Aa@5356313', 10);
    const allModules = JSON.stringify([
      'dashboard',
      'customers',
      'invoices',
      'supplier-agreements',
      'attendance',
      'import',
      'accrued-revenue',
      'users'
    ]);

    await prisma.systemUser.create({
      data: {
        username: 'admin',
        password: hashedPassword,
        role: 'ADMIN',
        permissions: allModules
      }
    });

    console.log('Default Admin user created successfully.');
  } else {
    console.log('Admin user already exists.');
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
