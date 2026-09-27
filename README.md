# RojgarSetu - Employment Tracking & Skill Gap AI Portal

An intelligent, production-ready employment tracking and career advisory web application designed to onboard candidates with verified credentials (Aadhaar, APAAR ID, Mobile), monitor employment lifecycle states (**Employed**, **Unemployed**, **Training**), and deliver personalized AI-powered career guidance via **CareerMitra AI**.

---

## Key Features

### 1. Signup & Registration Portal
- **Candidate Identification**:
  - **Full Name**
  - **Aadhaar Card Number**: 12-digit format with automatic `XXXX XXXX XXXX` masking, Luhn/UIDAI length check, and visibility toggle.
  - **APAAR ID**: 12-digit format (`XXXX-XXXX-XXXX`) representing the *Automated Permanent Academic Account Registry* ("One Nation, One Student ID" under National Education Policy).
  - **Mobile Number**: 10-digit Indian telephone format starting with 6, 7, 8, or 9 with `+91` prefix.
  - **Location/City**: Multi-city coverage across major Indian employment hubs (Bengaluru, Pune, Hyderabad, Delhi-NCR, Mumbai, Chennai, Ahmedabad, Jaipur, etc.).
- **3 Mandatory Employment Statuses with Adaptive Conditional Forms**:
  - 💼 **Employed**: Captures Designation, Employer/Company Name, Package/Salary (CTC), and Work Mode (Hybrid/On-site/Remote).
  - 🔍 **Unemployed**: Captures Total Experience, Notice Period / Immediate Availability, and Target Salary.
  - 🎓 **Training**: Captures Training Course/Trade, Training Institution/Academy (e.g. ITI, PMKVY, CDAC, NSDC), Expected Completion Date, and Current Stage.
- **Interactive Skill Tag Selector**:
  - Quick-tap chips for in-demand technical, vocational, analytical, and soft skills.
  - Custom tag entry with Enter key support.

### 2. Candidate ID & Live Status Tracker
- Generates a candidate profile card displaying verified credentials (masked Aadhaar, APAAR ID, Mobile, City).
- Real-time **Skill Gap Card** comparing candidate skills against benchmark industry standards.
- Instant **City Job Recommendations** displaying active local roles and hiring hubs.
- **Status Transition Modal**: Enables candidates to easily graduate from `Training` or `Unemployed` into `Employed` status with updated employer and salary information.

### 3. CareerMitra AI - Trained Job Intelligence & Chatbot
- **Trained on 25+ Modern Industry Roles**:
  - 💻 **Software Developer / Software Engineer (SDE)**: DSA, OOP, Java/C++/Python, SQL, Git, System Design, Spring Boot, Microservices, Docker.
  - 📊 **Data Analyst & BI Specialist**: SQL (Window Functions & Joins), Advanced Excel (Pivot & Formulas), PowerBI/Tableau, EDA, Data Cleaning, Python (Pandas/NumPy), BigQuery/Snowflake.
  - 🤖 **AI & Machine Learning Engineer (Generative AI)**: Deep Learning (PyTorch), LLMs (LangChain/LlamaIndex), RAG Architectures, Vector DBs, Fine-Tuning.
  - ☁️ **Cloud & DevOps Engineer**: Linux, Docker, Kubernetes, CI/CD, AWS/Azure/GCP, Terraform, Prometheus/Grafana.
  - 🌐 **Full Stack, Backend, Frontend, QA Automation, UI/UX, Cyber Security, Core Engineering & Skilled Trades**.
- **Instant Requirement Lookups & Comparison**:
  - User can ask: *"What are the requirements for Software Developer?"* or *"Requirements for Data Analyst"*.
  - Displays **Core Must-Have Skills**, **Bonus Growth Tools**, **Average Market Salary (LPA)**, **Top Hiring Clusters**, and **Personalized Match %**.
- **Skill Gap Diagnosis & Actionable Roadmap**:
  - Compares candidate's skills with the benchmark and calculates **Readiness Score (%)**.
  - Generates a phase-by-phase learning roadmap with curated platforms (SWAYAM, NPTEL, LeetCode, GeeksforGeeks, freeCodeCamp).
- **City-Specific Job Matching**:
  - User can ask: *"Which jobs can I get in Pune with my skills?"* or *"Show jobs in Bengaluru"*.
  - Matches candidate skills to local market vacancies with hiring hubs (e.g., Hinjewadi, Whitefield, BKC, HITEC City).

---

## Project Structure

```
employment-tracking-app/
│
├── server.js             # Zero-dependency Node.js HTTP & SQLite REST API server
├── test_app.js           # Automated verification test suite (7 comprehensive tests)
├── index.html            # Main UI with responsive navigation, forms, dashboard & chatbot
├── css/
│   └── styles.css        # Glassmorphism, animations, custom typography & scrollbars
├── js/
│   ├── job-data.js       # Ontology of 25+ job roles, skills benchmarks & Indian city hubs
│   ├── skill-engine.js   # Skill gap calculation algorithms & fuzzy alias matching
│   ├── chatbot.js        # CareerMitra AI conversational agent & requirement card renderer
│   ├── form-handler.js   # Aadhaar, APAAR, Mobile validation & dynamic field logic
│   └── app.js            # State orchestrator, localStorage persistence & sample seed data
└── README.md             # Documentation and usage guide
```

---

## How to Run in Your IDE

### Method 1: Direct in Browser (Zero Setup Required)
1. Open this folder in your IDE (VS Code, Cursor, WebStorm, PyCharm, etc.).
2. Locate `index.html`.
3. Right-click `index.html` and select **"Open with Default Browser"** or double-click `index.html` in Windows File Explorer.
4. The entire app will run immediately with full functionality, animations, and database persistence!

### Method 2: Using VS Code / Cursor "Live Server"
1. In VS Code or Cursor, install the **Live Server** extension (by Ritwick Dey).
2. Right-click `index.html` and click **"Open with Live Server"**.
3. The app will open at `http://127.0.0.1:5500/index.html`.

### Method 3: Using Node.js or Python (If installed)
- **Node.js**:
  ```bash
  npx serve .
  ```
- **Python**:
  ```bash
  python -m http.server 8000
  ```
  Then open `http://localhost:8000`.

---

## Demonstration Scenarios to Try

1. **Test Registration & Validation**:
   - Go to the **Signup Portal** tab.
   - Enter a 12-digit Aadhaar (e.g. `5829 1039 4482`), 12-digit APAAR ID (e.g. `9810-4491-2281`), and 10-digit mobile (`9876543210`).
   - Switch between **Employed**, **Unemployed**, and **Training** to see dynamic conditional inputs adapt automatically.
   - Select skills (e.g. Python, SQL, Advanced Excel) and submit.
2. **Test the Skill Gap Chatbot**:
   - Switch to **CareerMitra AI Chatbot** tab or click the floating bubble at bottom right.
   - Click the prompt chip: **"🔍 Analyze my Skill Gap"**.
   - Watch the bot generate a visual breakdown of your matched skills, missing critical gaps, and 3-phase learning roadmap!
3. **Test City Job Recommendations**:
   - Ask the bot: *"What jobs can I get in Pune with my current skills?"*
   - See local job matches with salary estimates and specific local hiring parks (e.g. Hinjewadi, Kharadi).
4. **Test Employment Status Transition**:
   - Go to **My Profile & Tracker**.
   - Click **"Update Employment Status"**.
   - Change a candidate from `Training` to `Employed`, enter Company and Salary, and save.
   - Watch the national employment statistics update instantly!
