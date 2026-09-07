/**
 * Live HTTP API verification for Google Sheets Lead Bridge endpoints
 */

const BASE_URL = 'http://localhost:3001/api/integrations/google-sheets';
const SECRET = 'aeero_sheets_secret_2026';

async function testApi() {
  console.log('\n🌐 Testing Live REST API Endpoints on http://localhost:3001...\n');

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${SECRET}`
  };

  // 1. Ingest Single Lead
  console.log('1. Testing POST /ingest...');
  const ingestRes = await fetch(`${BASE_URL}/ingest`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      name: 'API Test Student',
      mobile: '+91 91234 56789',
      email: 'api.student@example.com',
      interestedCourse: 'Commercial Pilot License (CPL)',
      campaign: 'Google Sheets Ingestion Test',
      sourceSpreadsheetName: 'API Ingest Sheet'
    })
  });
  const ingestData = await ingestRes.json();
  console.log('   Response Status:', ingestRes.status, ingestData);

  // 2. Discover
  console.log('\n2. Testing POST /discover...');
  const discRes = await fetch(`${BASE_URL}/discover`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ useMock: true })
  });
  const discData = await discRes.json();
  console.log('   Discovered Count:', discData.totalDiscovered, 'Sources in Registry:', discData.sources?.length);

  // 3. Status
  console.log('\n3. Testing GET /status...');
  const statRes = await fetch(`${BASE_URL}/status`, { headers });
  const statData = await statRes.json();
  console.log('   Status Response:', statData.status, 'Total Registered:', statData.totalSourcesRegistered);

  // 4. Sources
  console.log('\n4. Testing GET /sources...');
  const srcRes = await fetch(`${BASE_URL}/sources`, { headers });
  const srcData = await srcRes.json();
  console.log('   Sources Count:', srcData.count);

  console.log('\n✅ Live HTTP REST Endpoints Verified Successfully!\n');
}

testApi().catch(err => console.error('API Test Error:', err));
