const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function reset() {
  await prisma.transaction.deleteMany({});
  await prisma.invoice.deleteMany({});
  await prisma.payment.deleteMany({});
  await prisma.return.deleteMany({});
  await prisma.$executeRawUnsafe('UPDATE Customer SET currentBalance = openingBalance');
  console.log('Reset complete!');
}

reset().finally(() => prisma.$disconnect());
