const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.lead.count().then(c => console.log('Total Leads:', c)).catch(console.error).finally(() => prisma.$disconnect());
