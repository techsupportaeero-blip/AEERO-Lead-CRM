const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  await prisma.activity.deleteMany({});
  await prisma.payment.deleteMany({});
  await prisma.note.deleteMany({});
  await prisma.task.deleteMany({});
  await prisma.followUp.deleteMany({});
  await prisma.auditLog.deleteMany({});
  
  await prisma.lead.deleteMany({});
  console.log('Successfully deleted all leads and their related records from Prisma Database!');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
