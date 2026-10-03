import { prisma } from './src/config/database.js';

async function main() {
  const all = await prisma.payment.findMany({ orderBy: { createdAt: 'desc' } });
  console.log('Total payment rows:', all.length);
  all.forEach(p => {
    console.log(p.id, p.leadId, '| amount:', p.amount.toString(), '| method:', p.paymentMethod, '| createdBy:', p.createdBy, '| notes:', p.notes, '| created:', p.createdAt.toISOString());
  });
  await prisma.$disconnect();
}
main();
