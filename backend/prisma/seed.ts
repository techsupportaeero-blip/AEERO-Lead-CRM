import { PrismaClient, Role, LeadStatus, Priority, ActivityType, FollowUpType, FollowUpStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting AEERO CRM Database Seed...');

  // 1. Password Hashes
  const adminPasswordHash = await bcrypt.hash('admin123', 10);
  const induPasswordHash = await bcrypt.hash('Indu@2026', 10);
  const ayeshaPasswordHash = await bcrypt.hash('Ayesha@2026', 10);
  const pritiPasswordHash = await bcrypt.hash('Priti@2026', 10);

  // 2. Seed Users
  console.log('👤 Seeding System Users with Individual Secure Passwords...');
  const usersData = [
    {
      username: 'admin',
      name: 'Admin User 1',
      email: 'admin@aeero.edu',
      phone: '+91 99999 11111',
      passwordHash: adminPasswordHash,
      role: Role.ADMIN,
      isActive: true
    },
    {
      username: 'indu',
      name: 'MS. INDU',
      email: 'indu@aeero.edu',
      phone: '+91 62396 10062',
      passwordHash: induPasswordHash,
      role: Role.LEAD_FINDER,
      isActive: true
    },
    {
      username: 'ayesha',
      name: 'MS. AYESHA',
      email: 'ayesha@aeero.edu',
      phone: '+91 99999 00002',
      passwordHash: ayeshaPasswordHash,
      role: Role.LEAD_FINDER,
      isActive: true
    },
    {
      username: 'priti',
      name: 'MS. PRITI',
      email: 'priti@aeero.edu',
      phone: '+91 99999 00003',
      passwordHash: pritiPasswordHash,
      role: Role.LEAD_FINDER,
      isActive: true
    }
  ];

  // Delete any other users not in the allowed list
  await prisma.user.deleteMany({
    where: {
      username: { notIn: usersData.map(u => u.username) }
    }
  });

  for (const u of usersData) {
    await prisma.user.upsert({
      where: { username: u.username },
      update: { name: u.name, email: u.email, role: u.role, passwordHash: u.passwordHash, isActive: u.isActive },
      create: u
    });
  }

  // 3. Seed Lead Sources
  console.log('📌 Seeding Lead Sources...');
  const leadSourcesData = [
    { name: 'Website', code: 'WEB' },
    { name: 'Meta Ads', code: 'META' },
    { name: 'Google Ads', code: 'GOOGLE' },
    { name: 'WhatsApp', code: 'WHATSAPP' },
    { name: 'Referral', code: 'REFERRAL' },
    { name: 'Walk-in', code: 'WALKIN' },
    { name: 'Organic', code: 'ORGANIC' },
    { name: 'YouTube', code: 'YOUTUBE' },
    { name: 'LinkedIn', code: 'LINKEDIN' },
    { name: 'Other', code: 'OTHER' },
    { name: 'Manual Entry', code: 'MANUAL' }
  ];

  for (const src of leadSourcesData) {
    await prisma.leadSource.upsert({
      where: { name: src.name },
      update: { code: src.code, isActive: true },
      create: { name: src.name, code: src.code, isActive: true }
    });
  }

  // 4. Seed Courses
  console.log('📚 Seeding Courses Catalog...');
  const coursesData = [
    {
      code: 'SAFETY',
      name: 'Diploma in Industrial Safety',
      description: 'Industrial Safety & Workplace Risk Management Course',
      price: 120000
    },
    {
      code: 'SUB_FIRE',
      name: 'Sub Fire Officer',
      description: 'Fire Officer Training & Emergency Management',
      price: 95000
    },
    {
      code: 'FIREMAN',
      name: 'Fireman',
      description: 'Fire Safety & Firefighting Operations Training',
      price: 75000
    },
    {
      code: 'SANITARY',
      name: 'Diploma In Sanitary Inspector',
      description: 'Sanitation & Public Health Inspection Diploma',
      price: 85000
    },
    {
      code: 'HEALTH_SANITARY',
      name: 'Health Sanitary Inspector',
      description: 'Health & Municipal Sanitation Training',
      price: 85000
    },
    {
      code: 'MSME',
      name: 'MSME',
      description: 'MSME Certified Vocational & Skill Training Program',
      price: 60000
    }
  ];

  for (const c of coursesData) {
    await prisma.course.upsert({
      where: { code: c.code },
      update: { name: c.name, description: c.description, price: c.price, isActive: true },
      create: { code: c.code, name: c.name, description: c.description, price: c.price, isActive: true }
    });
  }

  // 5. Seed Lead Counter — dynamically set to current max
  const latestLead = await prisma.lead.findFirst({
    orderBy: { id: 'desc' },
    select: { id: true, leadId: true }
  });
  let currentMax = 0;
  if (latestLead?.leadId && latestLead.leadId.startsWith('LD-')) {
    const parsed = parseInt(latestLead.leadId.replace('LD-', ''), 10);
    if (!isNaN(parsed)) currentMax = parsed;
  }
  await prisma.leadCounter.upsert({
    where: { name: 'lead_seq' },
    update: { lastNumber: Math.max(currentMax, latestLead?.id || 0) },
    create: { name: 'lead_seq', lastNumber: Math.max(currentMax, latestLead?.id || 0) }
  });

  // NOTE: Demo leads, activities, follow-ups, payments, and customers have been removed.
  // The CRM now uses only real data imported from Google Sheets.

  console.log('✅ AEERO CRM Database seed completed successfully! (No demo leads created)');
}

main()
  .catch((e) => {
    console.error('❌ Error during database seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

