/**
 * AEERO Lead Management CRM - Backend E2E Test Suite
 * Tests all core API endpoints, validations, RBAC, duplicate checks, and ID generation.
 */

export {};

const BASE_URL = process.env.TEST_API_URL || 'http://localhost:3001/api';

async function runTests() {
  console.log('\n=============================================================');
  console.log(`🧪 Starting AEERO CRM Backend Test Suite against: ${BASE_URL}`);
  console.log('=============================================================\n');

  let passed = 0;
  let failed = 0;

  async function test(name: string, fn: () => Promise<void>) {
    try {
      process.stdout.write(`⏳ Testing: ${name}... `);
      await fn();
      console.log('✅ PASSED');
      passed++;
    } catch (err: any) {
      console.log('❌ FAILED');
      console.error(`   Error: ${err.message}`);
      failed++;
    }
  }

  // 1. Health Check
  await test('Health Check Endpoint (GET /api/health)', async () => {
    const res = await fetch(`${BASE_URL}/health`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (!data.status) throw new Error('Status field missing');
  });

  // 2. Auth Login (Admin)
  let adminToken = '';
  await test('User Login - Admin (POST /api/auth/login)', async () => {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'admin123' })
    });
    if (!res.ok) throw new Error(`Login failed with HTTP ${res.status}`);
    const data = await res.json();
    if (!data.token || !data.user || data.user.role !== 'ADMIN') {
      throw new Error('Invalid user or token returned');
    }
    adminToken = data.token;
  });

  // 3. User Login - Lead Finder
  let counselorToken = '';
  await test('User Login - Lead Finder (POST /api/auth/login)', async () => {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'sourav', password: 'password123' })
    });
    if (!res.ok) throw new Error(`Login failed with HTTP ${res.status}`);
    const data = await res.json();
    if (!data.token || !data.user || data.user.role !== 'LEAD_FINDER') {
      throw new Error('Invalid counselor profile returned');
    }
    counselorToken = data.token;
  });

  // 4. Auth Me Profile
  await test('Authenticated User Profile (GET /api/auth/me)', async () => {
    const res = await fetch(`${BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (!data.data || data.data.username !== 'admin') {
      throw new Error('Me profile mismatch');
    }
  });

  // 5. Public Lead Capture API
  const testPhone = `+91 99${Math.floor(10000000 + Math.random() * 90000000)}`;
  const testEmail = `test.student.${Date.now()}@example.com`;
  let publicLeadId = '';

  await test('Public Lead Capture API (POST /api/public/leads)', async () => {
    const res = await fetch(`${BASE_URL}/public/leads`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Aakash Verma',
        mobile: testPhone,
        email: testEmail,
        city: 'Jaipur',
        interestedCourse: 'Diploma in Industrial Safety',
        source: 'Website'
      })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(`HTTP ${res.status}: ${JSON.stringify(err)}`);
    }
    const data = await res.json();
    if (!data.leadId || !data.leadId.startsWith('LD-')) {
      throw new Error(`Invalid Lead ID format: ${data.leadId}`);
    }
    publicLeadId = data.leadId;
  });

  // 6. Duplicate Lead Detection
  await test('Duplicate Lead Prevention (POST /api/public/leads with duplicate phone)', async () => {
    const res = await fetch(`${BASE_URL}/public/leads`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Aakash Duplicate',
        mobile: testPhone,
        email: 'different.email@example.com',
        source: 'Website'
      })
    });
    if (res.status !== 409) {
      throw new Error(`Expected HTTP 409 Conflict, got ${res.status}`);
    }
    const data = await res.json();
    if (!data.isDuplicate) {
      throw new Error('isDuplicate flag expected in response');
    }
  });

  // 7. Check Duplicate Endpoint
  await test('Check Duplicate Endpoint (POST /api/leads/check-duplicate)', async () => {
    const res = await fetch(`${BASE_URL}/leads/check-duplicate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mobile: testPhone })
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (!data.isDuplicate) {
      throw new Error('Expected duplicate lead detection');
    }
  });

  // 8. CRM Lead Creation (Authenticated)
  const crmPhone = `+91 97${Math.floor(10000000 + Math.random() * 90000000)}`;
  let crmLeadId = '';
  await test('Authenticated Lead Creation (POST /api/leads)', async () => {
    const res = await fetch(`${BASE_URL}/leads`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${counselorToken}`
      },
      body: JSON.stringify({
        name: 'Neha Singh',
        mobile: crmPhone,
        email: `neha.${Date.now()}@example.com`,
        city: 'Mumbai',
        interestedCourse: 'Sub Fire Officer',
        source: 'Google Ads',
        status: 'NEW',
        priority: 'HIGH'
      })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(`HTTP ${res.status}: ${JSON.stringify(err)}`);
    }
    const data = await res.json();
    if (!data.leadId || !data.leadId.startsWith('LD-')) {
      throw new Error('Invalid leadId');
    }
    crmLeadId = data.leadId;
  });

  // 9. Get Leads with Filter & Search
  await test('Query Leads with Search Filter (GET /api/leads?search=Neha)', async () => {
    const res = await fetch(`${BASE_URL}/leads?search=Neha`, {
      headers: { Authorization: `Bearer ${counselorToken}` }
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const leads = await res.json();
    const list = Array.isArray(leads) ? leads : leads.data || [];
    if (list.length === 0) throw new Error('Search did not return created lead');
  });

  // 10. Update Lead
  await test('Update Lead Attributes (PUT /api/leads/:id)', async () => {
    const res = await fetch(`${BASE_URL}/leads/${crmLeadId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${counselorToken}`
      },
      body: JSON.stringify({
        city: 'Navi Mumbai',
        status: 'INTERESTED',
        priority: 'URGENT'
      })
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const updated = await res.json();
    if (updated.status !== 'INTERESTED') {
      throw new Error(`Status not updated: ${updated.status}`);
    }
  });

  // 11. Fast Kanban Status Update
  await test('Fast Kanban Status Update (PUT /api/leads/:id/status)', async () => {
    const res = await fetch(`${BASE_URL}/leads/${crmLeadId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${counselorToken}`
      },
      body: JSON.stringify({ status: 'FOLLOW_UP' })
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const updated = await res.json();
    if (updated.status !== 'FOLLOW_UP') {
      throw new Error('Kanban status update failed');
    }
  });

  // 12. Add Call Activity
  await test('Record Call Activity (POST /api/leads/:id/activities)', async () => {
    const res = await fetch(`${BASE_URL}/leads/${crmLeadId}/activities`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${counselorToken}`
      },
      body: JSON.stringify({
        type: 'CALL',
        outcome: 'RESPONDED',
        remarks: 'Student interested in Fire Safety course fee structure',
        additionalInformation: 'Sent syllabus over WhatsApp',
        duration: 8
      })
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (!data.activity && !data.message) {
      throw new Error('Activity response invalid');
    }
  });

  // 13. Schedule Follow-up
  await test('Schedule Follow-up (POST /api/leads/:id/followups)', async () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split('T')[0];

    const res = await fetch(`${BASE_URL}/leads/${crmLeadId}/followups`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${counselorToken}`
      },
      body: JSON.stringify({
        date: dateStr,
        time: '02:30 PM',
        type: 'CALL',
        notes: 'Follow-up on fee submission token'
      })
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (!data.id) throw new Error('Followup not created');
  });

  // 14. Dashboard Analytics Summary
  await test('Dashboard Summary API (GET /api/dashboard/summary)', async () => {
    const res = await fetch(`${BASE_URL}/dashboard/summary`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (typeof data.totalLeads !== 'number' || !Array.isArray(data.leadPipeline)) {
      throw new Error('Dashboard summary structure invalid');
    }
  });

  // 15. System Config Endpoint
  await test('System Config Endpoint (GET /api/config)', async () => {
    const res = await fetch(`${BASE_URL}/config`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (!Array.isArray(data.courses) || !Array.isArray(data.leadSources)) {
      throw new Error('Config missing courses or leadSources');
    }
  });

  // 16. Archive and Unarchive (RBAC Test)
  await test('Archive & Restore Lead (RBAC: Admin Only Unarchive)', async () => {
    // Archive
    const arcRes = await fetch(`${BASE_URL}/leads/${crmLeadId}/archive`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${counselorToken}` }
    });
    if (!arcRes.ok) throw new Error('Archive failed');

    // Attempt unarchive with Lead Finder role (should fail 403)
    const failUnarc = await fetch(`${BASE_URL}/leads/${crmLeadId}/unarchive`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${counselorToken}`
      },
      body: JSON.stringify({ currentUser: 'sourav', userRole: 'LEAD_FINDER' })
    });
    if (failUnarc.status !== 403) {
      throw new Error('Expected 403 Forbidden for non-admin unarchive');
    }

    // Unarchive with Admin role (should succeed)
    const successUnarc = await fetch(`${BASE_URL}/leads/${crmLeadId}/unarchive`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({ currentUser: 'admin', userRole: 'ADMIN' })
    });
    if (!successUnarc.ok) throw new Error('Admin unarchive failed');
  });

  console.log('\n=============================================================');
  console.log(`📊 Test Results: ${passed} PASSED | ${failed} FAILED`);
  console.log('=============================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
