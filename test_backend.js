/**
 * RojgarSetu Automated Backend Test Suite
 * Validates SQLite Database operations, REST endpoints, e-KYC lookup,
 * profile update, status change, and account deletion.
 */

const http = require('node:http');

const PORT = 3982;
process.env.PORT = PORT;

// Require server directly
const server = require('./server.js');

function request(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, headers: res.headers, body: body ? JSON.parse(body) : null });
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, body });
        }
      });
    });
    req.on('error', reject);
    if (data) {
      req.write(typeof data === 'string' ? data : JSON.stringify(data));
    }
    req.end();
  });
}

async function runTests() {
  console.log('----------------------------------------------------');
  console.log('🧪 Starting RojgarSetu Backend & SQLite Test Suite...');
  console.log('----------------------------------------------------');

  let passed = 0;
  let failed = 0;

  function assert(name, condition, extra = '') {
    if (condition) {
      console.log(`  ✅ PASS: ${name} ${extra}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${name} ${extra}`);
      failed++;
    }
  }

  try {
    // 1. Health check
    const health = await request({
      hostname: '127.0.0.1',
      port: PORT,
      path: '/api/health',
      method: 'GET'
    });
    assert('GET /api/health returns 200', health.status === 200);
    assert('Health returns online and storage', health.body.status === 'online' && !!health.body.storage);

    // 2. Fetch candidates
    const candidatesRes = await request({
      hostname: '127.0.0.1',
      port: PORT,
      path: '/api/candidates',
      method: 'GET'
    });
    assert('GET /api/candidates returns 200', candidatesRes.status === 200);
    assert('Seed candidates exist in database', candidatesRes.body.count >= 3);

    // 3. Register a new candidate (with PAN card)
    const testCandidate = {
      id: 'CAN-TEST-' + Math.floor(1000 + Math.random() * 9000),
      fullName: 'Sunita Narayanan',
      aadhaarMasked: 'XXXX XXXX 9912',
      aadhaarRaw: '582019389912',
      apaarId: '5512-8821-9921',
      panCard: 'SUNPN9912K',
      mobile: '+91 9845123456',
      mobileRaw: '9845123456',
      city: 'Pune',
      education: 'B.Tech IT',
      targetJob: 'Cloud & DevOps Platform Engineer',
      employmentStatus: 'Unemployed',
      statusDetails: { experienceLevel: 'Fresher', availability: 'Immediate' },
      skills: ['Linux', 'Docker', 'AWS', 'Bash']
    };

    const registerRes = await request({
      hostname: '127.0.0.1',
      port: PORT,
      path: '/api/candidates',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, testCandidate);

    assert('POST /api/candidates returns 201 Created', registerRes.status === 201);
    assert('Registered candidate PAN card matches', registerRes.body.data.panCard === 'SUNPN9912K');
    assert('Registered candidate ID matches', registerRes.body.data.id === testCandidate.id);

    // 3b. Register a candidate WITHOUT Aadhaar and WITHOUT PAN (Optional check)
    const optionalCandidate = {
      id: 'CAN-OPT-' + Math.floor(1000 + Math.random() * 9000),
      fullName: 'Rahul Verma (No Aadhaar/PAN)',
      aadhaarMasked: 'Not Provided',
      aadhaarRaw: '',
      apaarId: '9900-1122-3344',
      panCard: 'Not Provided',
      mobile: '+91 9811223344',
      mobileRaw: '9811223344',
      city: 'Delhi',
      education: 'Higher Secondary (12th)',
      targetJob: 'Electrician & Wireman Specialist',
      employmentStatus: 'Employed',
      statusDetails: { company: 'Shree Electricals', currentRole: 'Field Electrician', salary: '₹3.2 LPA' },
      skills: ['Wiring', 'Circuit Testing']
    };

    const registerOptRes = await request({
      hostname: '127.0.0.1',
      port: PORT,
      path: '/api/candidates',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, optionalCandidate);

    assert('POST /api/candidates succeeds without Aadhaar & PAN', registerOptRes.status === 201);
    assert('Candidate created with Not Provided Aadhaar', registerOptRes.body.data.aadhaarMasked === 'Not Provided');
    assert('Candidate created with Not Provided PAN', registerOptRes.body.data.panCard === 'NOT PROVIDED' || registerOptRes.body.data.panCard === 'Not Provided');

    // 4. Read single candidate
    const getSingle = await request({
      hostname: '127.0.0.1',
      port: PORT,
      path: `/api/candidates/${testCandidate.id}`,
      method: 'GET'
    });
    assert('GET /api/candidates/:id returns 200', getSingle.status === 200);
    assert('Retrieved candidate name matches', getSingle.body.data.fullName === 'Sunita Narayanan');

    // 5. Update Status (PATCH)
    const patchStatus = await request({
      hostname: '127.0.0.1',
      port: PORT,
      path: `/api/candidates/${testCandidate.id}/status`,
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' }
    }, {
      employmentStatus: 'Employed',
      statusDetails: { company: 'Red Hat India', currentRole: 'Cloud Engineer', salary: '₹8.5 LPA' }
    });
    assert('PATCH /api/candidates/:id/status returns 200', patchStatus.status === 200);
    assert('Status updated to Employed', patchStatus.body.data.employmentStatus === 'Employed');
    assert('Company set in statusDetails', patchStatus.body.data.statusDetails.company === 'Red Hat India');

    // 6. Profile Edit (PUT)
    const putProfile = await request({
      hostname: '127.0.0.1',
      port: PORT,
      path: `/api/candidates/${testCandidate.id}`,
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' }
    }, {
      fullName: 'Sunita N. Rao',
      city: 'Bengaluru',
      education: 'M.Tech Cloud Architecture'
    });
    assert('PUT /api/candidates/:id returns 200', putProfile.status === 200);
    assert('Updated full name stored', putProfile.body.data.fullName === 'Sunita N. Rao');
    assert('Updated city stored', putProfile.body.data.city === 'Bengaluru');

    // 7. Verify UIDAI e-KYC lookup
    const kycRes = await request({
      hostname: '127.0.0.1',
      port: PORT,
      path: '/api/kyc/verify',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { aadhaar: '492019388842' });
    assert('POST /api/kyc/verify returns 200', kycRes.status === 200);
    assert('Known Aadhaar returns Aarav Sharma', kycRes.body.data.fullName === 'Aarav Sharma');

    // 8. Stats Calculation
    const statsRes = await request({
      hostname: '127.0.0.1',
      port: PORT,
      path: '/api/stats',
      method: 'GET'
    });
    assert('GET /api/stats returns 200', statsRes.status === 200);
    assert('Stats counts are calculated', typeof statsRes.body.stats.totalCandidates === 'number');

    // 9. Candidate Account Deletion (DELETE)
    const deleteRes = await request({
      hostname: '127.0.0.1',
      port: PORT,
      path: `/api/candidates/${testCandidate.id}`,
      method: 'DELETE'
    });
    assert('DELETE /api/candidates/:id returns 200', deleteRes.status === 200);
    assert('Delete response indicates success', deleteRes.body.success === true);

    // Verify deletion in database
    const verifyDelete = await request({
      hostname: '127.0.0.1',
      port: PORT,
      path: `/api/candidates/${testCandidate.id}`,
      method: 'GET'
    });
    assert('Deleted candidate now returns 404', verifyDelete.status === 404);

  } catch (err) {
    console.error('Test execution error:', err);
    failed++;
  } finally {
    server.close(() => {
      console.log('----------------------------------------------------');
      console.log(`📊 Test Summary: ${passed} Passed, ${failed} Failed`);
      console.log('----------------------------------------------------');
      process.exit(failed > 0 ? 1 : 0);
    });
  }
}

runTests();
