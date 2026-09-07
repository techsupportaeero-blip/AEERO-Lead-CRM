import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
prisma.lead.count().then(c => console.log('Total Leads:', c)).finally(() => prisma.$disconnect());
