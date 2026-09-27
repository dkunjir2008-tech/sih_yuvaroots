/**
 * RojgarSetu - Employment Tracking & Skill Gap AI Backend Server
 * Zero external dependencies: Uses Node.js built-ins 'node:http', 'node:fs', 'node:path', 'node:sqlite'
 */

const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

// ---------------------------------------------------------------------------
// 1. DATABASE & STORAGE (SQLite with JSON file fallback)
// ---------------------------------------------------------------------------
let db = null;
const DATA_FILE = path.join(__dirname, 'candidates_db.json');

try {
  const { DatabaseSync } = require('node:sqlite');
  const dbPath = path.join(__dirname, 'employment_tracking.db');
  db = new DatabaseSync(dbPath);
  db.exec(`
    CREATE TABLE IF NOT EXISTS candidates (
      id TEXT PRIMARY KEY,
      fullName TEXT NOT NULL,
      aadhaarMasked TEXT NOT NULL,
      aadhaarRaw TEXT,
      apaarId TEXT NOT NULL,
      panCard TEXT,
      mobile TEXT NOT NULL,
      mobileRaw TEXT,
      city TEXT NOT NULL,
      education TEXT,
      targetJob TEXT NOT NULL,
      employmentStatus TEXT NOT NULL,
      statusDetails TEXT,
      skills TEXT,
      registeredDate TEXT,
      lastUpdated TEXT
    );
  `);
  // Ensure panCard column exists if table was already created earlier
  try {
    db.exec(`ALTER TABLE candidates ADD COLUMN panCard TEXT;`);
  } catch (alterErr) {
    // Column already exists, ignore
  }
  console.log('[RojgarSetu Server] SQLite database initialized at:', dbPath);
} catch (err) {
  console.warn('[RojgarSetu Server] SQLite unavailable, falling back to JSON file storage:', err.message);
}

function readJsonDb() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    }
  } catch (e) {
    console.error('Error reading JSON DB:', e);
  }
  return [];
}

function writeJsonDb(data) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (e) {
    console.error('Error writing JSON DB:', e);
  }
}

function getAllCandidates() {
  if (db) {
    try {
      const stmt = db.prepare('SELECT * FROM candidates ORDER BY lastUpdated DESC');
      const rows = stmt.all();
      return rows.map(r => ({
        ...r,
        statusDetails: r.statusDetails ? JSON.parse(r.statusDetails) : {},
        skills: r.skills ? JSON.parse(r.skills) : []
      }));
    } catch (e) {
      console.error('Error querying SQLite:', e);
    }
  }
  return readJsonDb();
}

function getCandidateById(id) {
  if (db) {
    try {
      const stmt = db.prepare('SELECT * FROM candidates WHERE id = ?');
      const r = stmt.get(id);
      if (r) {
        return {
          ...r,
          statusDetails: r.statusDetails ? JSON.parse(r.statusDetails) : {},
          skills: r.skills ? JSON.parse(r.skills) : []
        };
      }
      return null;
    } catch (e) {
      console.error('Error getting candidate by ID:', e);
    }
  }
  const list = readJsonDb();
  return list.find(c => c.id === id) || null;
}

function saveCandidate(c) {
  if (db) {
    try {
      const stmt = db.prepare(`
        INSERT INTO candidates (
          id, fullName, aadhaarMasked, aadhaarRaw, apaarId, panCard, mobile, mobileRaw,
          city, education, targetJob, employmentStatus, statusDetails, skills,
          registeredDate, lastUpdated
        ) VALUES (
          ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
        )
        ON CONFLICT(id) DO UPDATE SET
          fullName=excluded.fullName,
          aadhaarMasked=excluded.aadhaarMasked,
          aadhaarRaw=excluded.aadhaarRaw,
          apaarId=excluded.apaarId,
          panCard=excluded.panCard,
          mobile=excluded.mobile,
          mobileRaw=excluded.mobileRaw,
          city=excluded.city,
          education=excluded.education,
          targetJob=excluded.targetJob,
          employmentStatus=excluded.employmentStatus,
          statusDetails=excluded.statusDetails,
          skills=excluded.skills,
          lastUpdated=excluded.lastUpdated;
      `);
      stmt.run(
        c.id,
        c.fullName,
        c.aadhaarMasked,
        c.aadhaarRaw || '',
        c.apaarId,
        c.panCard || '',
        c.mobile,
        c.mobileRaw || '',
        c.city,
        c.education || '',
        c.targetJob,
        c.employmentStatus,
        JSON.stringify(c.statusDetails || {}),
        JSON.stringify(c.skills || []),
        c.registeredDate || new Date().toISOString().split('T')[0],
        c.lastUpdated || new Date().toISOString().split('T')[0]
      );
      return c;
    } catch (e) {
      console.error('Error saving to SQLite:', e);
    }
  }

  // JSON Fallback
  const list = readJsonDb();
  const idx = list.findIndex(item => item.id === c.id);
  if (idx >= 0) {
    list[idx] = c;
  } else {
    list.unshift(c);
  }
  writeJsonDb(list);
  return c;
}

function deleteCandidateById(id) {
  if (db) {
    try {
      const stmt = db.prepare('DELETE FROM candidates WHERE id = ?');
      const res = stmt.run(id);
      return res.changes > 0;
    } catch (e) {
      console.error('Error deleting from SQLite:', e);
    }
  }
  const list = readJsonDb();
  const initialLen = list.length;
  const filtered = list.filter(item => item.id !== id);
  if (filtered.length !== initialLen) {
    writeJsonDb(filtered);
    return true;
  }
  return false;
}

// ---------------------------------------------------------------------------
// 2. CENTRAL UIDAI e-KYC VERIFICATION REGISTRY (Mock)
// ---------------------------------------------------------------------------
const UIDAI_CENTRAL_REGISTRY = {
  "492019388842": {
    fullName: "Aarav Sharma",
    apaarId: "9820-4102-3918",
    panCard: "AARPS8842A",
    mobile: "9876543210",
    city: "Pune",
    education: "B.Tech Computer Science",
    targetJob: "Software Developer / Software Engineer (SDE)",
    skills: ["Data Structures & Algorithms (DSA)", "Java or C++ or Python", "Git & GitHub", "JavaScript", "SQL"]
  },
  "782910393319": {
    fullName: "Priya Patel",
    apaarId: "4491-8820-1920",
    panCard: "PRYPP3319B",
    mobile: "9123456789",
    city: "Bengaluru",
    education: "B.Com / Analytics Certificate",
    targetJob: "Data Analyst & Business Intelligence Specialist",
    skills: ["SQL (Joins, Window Functions, Aggregations)", "Advanced Excel", "PowerBI or Tableau", "Python (Pandas & NumPy)", "Data Cleaning & Wrangling"]
  },
  "891029485104": {
    fullName: "Vikram Jadhav",
    apaarId: "7721-9930-4122",
    panCard: "VIKJ5104C",
    mobile: "9765432109",
    city: "Pune",
    education: "ITI Electrical Diploma",
    targetJob: "Licensed Industrial Electrician & Automation Technician",
    skills: ["Industrial Wiring & Conduits Installation", "Multimeter & Testing Tools Usage", "Industrial Safety & Lockout/Tagout (LOTO)", "Motor Controls & Troubleshooting"]
  }
};

// Algorithmic generator for any 12-digit Aadhaar
function generateUniversalKyc(aadhaarNumber) {
  const digits = aadhaarNumber.replace(/\D/g, "");
  if (digits.length !== 12) return null;

  if (UIDAI_CENTRAL_REGISTRY[digits]) {
    return UIDAI_CENTRAL_REGISTRY[digits];
  }

  const firstNames = ["Rohan", "Ananya", "Rahul", "Kavita", "Siddharth", "Meera", "Aditya", "Sneha", "Kunal", "Pooja", "Arjun", "Divya", "Suresh", "Gayatri"];
  const lastNames = ["Deshmukh", "Nair", "Iyer", "Reddy", "Verma", "Kulkarni", "Chauhan", "Banerjee", "Mehta", "Bhat", "Patil", "Rao", "Joshi", "Singhania"];
  const cities = ["Pune", "Bengaluru", "Mumbai", "Hyderabad", "Delhi-NCR", "Chennai", "Ahmedabad", "Jaipur", "Kolkata"];
  const roles = [
    "Software Developer / Software Engineer (SDE)",
    "Data Analyst & Business Intelligence Specialist",
    "Full Stack Web Developer (MERN / JAMStack)",
    "AI & Machine Learning Engineer",
    "Cloud & DevOps Platform Engineer",
    "Cybersecurity Analyst & SOC Operations",
    "Licensed Industrial Electrician & Automation Technician",
    "Medical Laboratory Technologist (MLT)",
    "Management Consultant / Strategy Associate",
    "Banking Probationary Officer (PO / Scale 1)"
  ];
  const educations = [
    "B.Tech Computer Science / IT",
    "B.Sc Computer Science / Data Science",
    "BCA / MCA",
    "Diploma in Engineering (Polytechnic)",
    "ITI Certified Technical Trade",
    "B.Com / Finance Specialization",
    "B.Sc Medical Laboratory / Healthcare"
  ];
  const skillSets = [
    ["Data Structures & Algorithms (DSA)", "Java or C++ or Python", "Git & GitHub", "SQL & Relational Databases"],
    ["SQL (Joins, Window Functions, Aggregations)", "Advanced Excel", "PowerBI or Tableau", "Python (Pandas & NumPy)"],
    ["HTML5 & Semantic Markup", "CSS3 & Tailwind CSS", "JavaScript (ES6+)", "React.js or Vue.js", "Node.js & Express"],
    ["Python & Scientific Computing", "PyTorch or TensorFlow", "Machine Learning Algorithms", "Data Preprocessing & Feature Engineering"],
    ["Linux Administration & Bash", "Docker & Containerization", "AWS or Azure Fundamentals", "CI/CD Pipelines (GitHub Actions)"],
    ["Network Security & Protocols", "Vulnerability Assessment", "SIEM Tools", "Security Auditing"],
    ["Industrial Wiring & Conduits Installation", "Multimeter & Testing Tools Usage", "Industrial Safety & Lockout/Tagout (LOTO)"]
  ];

  let hash = 0;
  for (let i = 0; i < digits.length; i++) {
    hash = (hash * 31 + digits.charCodeAt(i)) >>> 0;
  }

  const fn = firstNames[hash % firstNames.length];
  const ln = lastNames[(hash >> 2) % lastNames.length];
  const city = cities[(hash >> 4) % cities.length];
  const role = roles[(hash >> 6) % roles.length];
  const edu = educations[(hash >> 8) % educations.length];
  const skills = skillSets[(hash >> 10) % skillSets.length];

  const apaarPart1 = (1000 + (hash % 8999)).toString();
  const apaarPart2 = (1000 + ((hash >> 3) % 8999)).toString();
  const apaarPart3 = (1000 + ((hash >> 6) % 8999)).toString();
  const apaar = `${apaarPart1}-${apaarPart2}-${apaarPart3}`;

  const mobileSuffix = digits.slice(-6);
  const mobile = "98" + mobileSuffix + ((hash % 89) + 10).toString().slice(0, 2);

  // Derive standard PAN: 5 letters, 4 digits, 1 letter (e.g. ABCDE1234F)
  const panPrefixLetters = ["A", "B", "C", "D", "E", "F", "G", "H", "J", "K", "L", "M", "N", "P", "R", "S", "T"];
  const l1 = panPrefixLetters[hash % panPrefixLetters.length];
  const l2 = panPrefixLetters[(hash >> 2) % panPrefixLetters.length];
  const l3 = panPrefixLetters[(hash >> 4) % panPrefixLetters.length];
  const l4 = "P"; // 'P' stands for Person in PAN
  const l5 = (ln[0] || "X").toUpperCase();
  const panDigits = (1000 + (hash % 8999)).toString().padStart(4, "0");
  const lLast = panPrefixLetters[(hash >> 7) % panPrefixLetters.length];
  const derivedPan = `${l1}${l2}${l3}${l4}${l5}${panDigits}${lLast}`;

  return {
    fullName: `${fn} ${ln}`,
    apaarId: apaar,
    panCard: derivedPan,
    mobile: mobile.slice(0, 10),
    city: city,
    education: edu,
    targetJob: role,
    skills: skills
  };
}

// ---------------------------------------------------------------------------
// 3. HTTP SERVER & ROUTING
// ---------------------------------------------------------------------------
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', chunk => {
      data += chunk;
      if (data.length > 1e6) { // 1MB limit
        req.destroy();
        reject(new Error('Payload too large'));
      }
    });
    req.on('end', () => {
      try {
        resolve(data ? JSON.parse(data) : {});
      } catch (err) {
        resolve({});
      }
    });
    req.on('error', reject);
  });
}

function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  });
  res.end(JSON.stringify(data));
}

const server = http.createServer(async (req, res) => {
  const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
  const pathname = parsedUrl.pathname;
  const method = req.method;

  // Handle CORS preflight
  if (method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    });
    return res.end();
  }

  // =========================================================================
  // REST API ENDPOINTS (/api/*)
  // =========================================================================
  if (pathname.startsWith('/api/')) {

    // 1. Health check: GET /api/health
    if (pathname === '/api/health' && method === 'GET') {
      return sendJson(res, 200, {
        status: 'online',
        app: 'RojgarSetu Employment Tracking & Skill Gap API',
        storage: db ? 'sqlite' : 'json',
        timestamp: new Date().toISOString()
      });
    }

    // 2. Candidate collection: GET & POST /api/candidates
    if (pathname === '/api/candidates') {
      if (method === 'GET') {
        const all = getAllCandidates();
        const search = (parsedUrl.searchParams.get('search') || '').toLowerCase().trim();
        const status = parsedUrl.searchParams.get('status');
        const city = parsedUrl.searchParams.get('city');

        let filtered = all;
        if (status) {
          filtered = filtered.filter(c => c.employmentStatus.toLowerCase() === status.toLowerCase());
        }
        if (city) {
          filtered = filtered.filter(c => c.city.toLowerCase() === city.toLowerCase());
        }
        if (search) {
          filtered = filtered.filter(c => 
            c.fullName.toLowerCase().includes(search) ||
            (c.targetJob && c.targetJob.toLowerCase().includes(search)) ||
            (c.apaarId && c.apaarId.toLowerCase().includes(search)) ||
            (c.mobile && c.mobile.toLowerCase().includes(search)) ||
            (c.skills && c.skills.some(s => s.toLowerCase().includes(search)))
          );
        }

        return sendJson(res, 200, {
          success: true,
          count: filtered.length,
          total: all.length,
          data: filtered
        });
      }

      if (method === 'POST') {
        const body = await parseBody(req);
        if (!body.fullName || !body.aadhaarMasked || !body.apaarId || !body.mobile || !body.employmentStatus) {
          return sendJson(res, 400, {
            success: false,
            error: 'Missing required candidate fields (fullName, aadhaarMasked, apaarId, mobile, employmentStatus)'
          });
        }

        const id = body.id || 'CAN-' + Math.floor(100000 + Math.random() * 900000);
        const newCandidate = {
          id,
          fullName: body.fullName,
          aadhaarMasked: body.aadhaarMasked,
          aadhaarRaw: body.aadhaarRaw || '',
          apaarId: body.apaarId,
          panCard: (body.panCard || '').trim().toUpperCase(),
          mobile: body.mobile,
          mobileRaw: body.mobileRaw || '',
          city: body.city || 'Bengaluru',
          education: body.education || 'Diploma / ITI',
          targetJob: body.targetJob || 'Software Developer / Software Engineer (SDE)',
          employmentStatus: body.employmentStatus, // "Employed", "Unemployed", "Training"
          statusDetails: body.statusDetails || {},
          skills: Array.isArray(body.skills) ? body.skills : [],
          registeredDate: body.registeredDate || new Date().toISOString().split('T')[0],
          lastUpdated: new Date().toISOString().split('T')[0]
        };

        saveCandidate(newCandidate);
        return sendJson(res, 201, {
          success: true,
          message: 'Candidate registered successfully',
          data: newCandidate
        });
      }
    }

    // 3. Status update: PATCH /api/candidates/:id/status
    const statusMatch = pathname.match(/^\/api\/candidates\/([a-zA-Z0-9_-]+)\/status$/);
    if (statusMatch && method === 'PATCH') {
      const candidateId = statusMatch[1];
      const body = await parseBody(req);
      const existing = getCandidateById(candidateId);

      if (!existing) {
        return sendJson(res, 404, { success: false, error: 'Candidate not found' });
      }

      existing.employmentStatus = body.employmentStatus || existing.employmentStatus;
      if (body.statusDetails) {
        existing.statusDetails = { ...existing.statusDetails, ...body.statusDetails };
      }
      existing.lastUpdated = new Date().toISOString().split('T')[0];

      saveCandidate(existing);
      return sendJson(res, 200, { success: true, message: 'Candidate status updated', data: existing });
    }

    // 4. Candidate single resource: GET, PUT, DELETE /api/candidates/:id
    const candidateMatch = pathname.match(/^\/api\/candidates\/([a-zA-Z0-9_-]+)$/);
    if (candidateMatch) {
      const candidateId = candidateMatch[1];

      if (method === 'GET') {
        const candidate = getCandidateById(candidateId);
        if (!candidate) {
          return sendJson(res, 404, { success: false, error: 'Candidate not found' });
        }
        return sendJson(res, 200, { success: true, data: candidate });
      }

      if (method === 'PUT') {
        const body = await parseBody(req);
        const existing = getCandidateById(candidateId);
        if (!existing) {
          return sendJson(res, 404, { success: false, error: 'Candidate not found' });
        }

        // Editable fields: fullName, mobile, mobileRaw, city, education, targetJob, employmentStatus, statusDetails, skills
        // Aadhaar and APAAR are immutable security identifiers
        if (body.fullName) existing.fullName = body.fullName;
        if (body.mobile) existing.mobile = body.mobile;
        if (body.mobileRaw) existing.mobileRaw = body.mobileRaw;
        if (body.panCard !== undefined) existing.panCard = (body.panCard || '').trim().toUpperCase();
        if (body.city) existing.city = body.city;
        if (body.education) existing.education = body.education;
        if (body.targetJob) existing.targetJob = body.targetJob;
        if (body.employmentStatus) existing.employmentStatus = body.employmentStatus;
        if (body.statusDetails) existing.statusDetails = { ...existing.statusDetails, ...body.statusDetails };
        if (Array.isArray(body.skills)) existing.skills = body.skills;
        existing.lastUpdated = new Date().toISOString().split('T')[0];

        saveCandidate(existing);
        return sendJson(res, 200, {
          success: true,
          message: 'Candidate profile updated successfully',
          data: existing
        });
      }

      if (method === 'DELETE') {
        const success = deleteCandidateById(candidateId);
        if (!success) {
          return sendJson(res, 404, { success: false, error: 'Candidate not found or already deleted' });
        }
        return sendJson(res, 200, {
          success: true,
          message: 'Candidate account permanently deleted'
        });
      }
    }

    // 5. e-KYC Verification: POST /api/kyc/verify
    if (pathname === '/api/kyc/verify' && method === 'POST') {
      const body = await parseBody(req);
      const aadhaar = (body.aadhaar || body.aadhaarNumber || '').replace(/\D/g, '');

      if (aadhaar.length !== 12) {
        return sendJson(res, 400, {
          success: false,
          error: 'Aadhaar number must be exactly 12 digits'
        });
      }

      const kycData = generateUniversalKyc(aadhaar);
      return sendJson(res, 200, {
        success: true,
        verified: true,
        aadhaarMasked: 'XXXX XXXX ' + aadhaar.slice(-4),
        data: kycData
      });
    }

    // 6. Aggregate Statistics: GET /api/stats
    if (pathname === '/api/stats' && method === 'GET') {
      const all = getAllCandidates();
      const total = all.length;
      const employed = all.filter(c => c.employmentStatus === 'Employed').length;
      const unemployed = all.filter(c => c.employmentStatus === 'Unemployed').length;
      const training = all.filter(c => c.employmentStatus === 'Training').length;
      const employmentRate = total > 0 ? Math.round((employed / total) * 100) : 0;

      // Group by top cities
      const cityBreakdown = {};
      all.forEach(c => {
        cityBreakdown[c.city] = (cityBreakdown[c.city] || 0) + 1;
      });

      // Group by top target roles
      const roleBreakdown = {};
      all.forEach(c => {
        roleBreakdown[c.targetJob] = (roleBreakdown[c.targetJob] || 0) + 1;
      });

      return sendJson(res, 200, {
        success: true,
        stats: {
          totalCandidates: total,
          employedCount: employed,
          unemployedCount: unemployed,
          trainingCount: training,
          employmentRatePercent: employmentRate,
          cities: cityBreakdown,
          roles: roleBreakdown
        }
      });
    }

    // 7. CareerMitra AI Chat Query: POST /api/chat
    if (pathname === '/api/chat' && method === 'POST') {
      const body = await parseBody(req);
      const message = (body.message || '').trim();
      const candidateId = body.candidateId;
      const candidate = candidateId ? getCandidateById(candidateId) : null;

      let reply = "Hello! I am CareerMitra AI. Ask me about job roles, missing skills, salary benchmarks, or employment opportunities in India.";

      const lower = message.toLowerCase();
      if (lower.includes('skill') || lower.includes('gap')) {
        reply = `To bridge your skill gap for ${candidate ? candidate.targetJob : 'target roles'}, focus on building hands-on projects, participating in open-source, and earning industry credentials like CDAC / NSDC certifications.`;
      } else if (lower.includes('salary') || lower.includes('pay') || lower.includes('lpa')) {
        reply = "Average starting salaries in India range between ₹4.5 - ₹8.0 LPA for technical graduates and ₹8.0 - ₹16.0 LPA for specialized engineering, AI, and consulting roles.";
      } else if (lower.includes('city') || lower.includes('location') || lower.includes('jobs in')) {
        reply = "Major hiring hubs include Bengaluru (Electronic City, Outer Ring Road), Pune (Hinjewadi IT Park), Hyderabad (HITEC City), Delhi-NCR (Cyber City Gurugram), and Mumbai.";
      } else if (lower.includes('employed') || lower.includes('status')) {
        reply = `Status tracked: candidate status is currently synchronized with the national registry. Keep your profile updated to receive targeted job matches!`;
      }

      return sendJson(res, 200, {
        success: true,
        reply,
        timestamp: new Date().toISOString()
      });
    }

    // Unknown API route
    return sendJson(res, 404, { error: 'API route not found' });
  }

  // =========================================================================
  // STATIC FILE SERVING
  // =========================================================================
  let relativeFilePath = pathname === '/' ? 'index.html' : pathname.replace(/^\//, '');
  const filePath = path.join(__dirname, relativeFilePath);

  // Security check: ensure path is within directory
  if (!filePath.startsWith(__dirname)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    return res.end('Forbidden');
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      // Fallback to index.html for client side routing
      const indexHtmlPath = path.join(__dirname, 'index.html');
      fs.readFile(indexHtmlPath, (readErr, content) => {
        if (readErr) {
          res.writeHead(404, { 'Content-Type': 'text/plain' });
          return res.end('404 Not Found');
        }
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(content);
      });
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    fs.readFile(filePath, (readErr, data) => {
      if (readErr) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        return res.end('Server Error reading file');
      }
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(data);
    });
  });
});

// Seed default candidates if database is empty
const currentCandidates = getAllCandidates();
if (currentCandidates.length === 0) {
  const seedList = [
    {
      id: "CAN-104921",
      fullName: "Aarav Sharma",
      aadhaarMasked: "XXXX XXXX 8842",
      aadhaarRaw: "492019388842",
      apaarId: "9820-4102-3918",
      panCard: "AARPS8842A",
      mobile: "+91 9876543210",
      mobileRaw: "9876543210",
      city: "Pune",
      education: "B.Tech Computer Science",
      targetJob: "Software Developer / Software Engineer (SDE)",
      employmentStatus: "Training",
      statusDetails: {
        trainingCourse: "Full Stack & Algorithms Bootcamp",
        institution: "CDAC / NSDC Skill Center, Pune",
        expectedEnd: "November 2026",
        trainingStage: "Project Stage"
      },
      skills: ["Data Structures & Algorithms (DSA)", "Java or C++ or Python", "Git & GitHub", "JavaScript", "SQL"],
      registeredDate: "2026-07-15",
      lastUpdated: "2026-09-01"
    },
    {
      id: "CAN-104922",
      fullName: "Priya Patel",
      aadhaarMasked: "XXXX XXXX 3319",
      aadhaarRaw: "782910393319",
      apaarId: "4491-8820-1920",
      panCard: "PRYPP3319B",
      mobile: "+91 9123456789",
      mobileRaw: "9123456789",
      city: "Bengaluru",
      education: "B.Com / Analytics Certificate",
      targetJob: "Data Analyst & Business Intelligence Specialist",
      employmentStatus: "Employed",
      statusDetails: {
        currentRole: "Associate Data Analyst",
        company: "Infosys BPM Ltd.",
        salary: "₹5.2 LPA",
        workMode: "Hybrid"
      },
      skills: ["SQL (Joins, Window Functions, Aggregations)", "Advanced Excel", "PowerBI or Tableau", "Python (Pandas & NumPy)", "Data Cleaning & Wrangling"],
      registeredDate: "2026-05-10",
      lastUpdated: "2026-08-20"
    },
    {
      id: "CAN-104923",
      fullName: "Vikram Jadhav",
      aadhaarMasked: "XXXX XXXX 5104",
      aadhaarRaw: "891029485104",
      apaarId: "7721-9930-4122",
      panCard: "VIKJ5104C",
      mobile: "+91 9765432109",
      mobileRaw: "9765432109",
      city: "Pune",
      education: "ITI Electrical Diploma",
      targetJob: "Licensed Industrial Electrician & Automation Technician",
      employmentStatus: "Unemployed",
      statusDetails: {
        experienceLevel: "1 Year Apprenticeship",
        availability: "Immediate",
        expectedCtc: "₹3.2 LPA"
      },
      skills: ["Industrial Wiring & Conduits Installation", "Multimeter & Testing Tools Usage", "Industrial Safety & Lockout/Tagout (LOTO)", "Motor Controls & Troubleshooting"],
      registeredDate: "2026-08-01",
      lastUpdated: "2026-09-02"
    }
  ];

  seedList.forEach(c => saveCandidate(c));
  console.log('[RojgarSetu Server] Seeded 3 default candidates across Employed, Unemployed, and Training states.');
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log('================================================================');
  console.log(`🚀 RojgarSetu Employment Tracking Portal running at: http://localhost:${PORT}`);
  console.log(`📡 REST API active at: http://localhost:${PORT}/api/candidates`);
  console.log('================================================================');
});

module.exports = server;
