const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixAndTest() {
  await prisma.user.updateMany({
    where: { email: 'admin@shivomconstruction.com' },
    data: { isActive: true },
  });

  await prisma.user.updateMany({
    where: { email: 'admin@buildstock.com' },
    data: { isActive: false },
  });

  const count = await prisma.user.count({
    where: { role: 'ADMIN', isActive: true },
  });

  console.log('Active ADMIN count in DB:', count);
}

fixAndTest().then(() => prisma.$disconnect());
