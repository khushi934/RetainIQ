# RetainIQ — Customer Retention Intelligence Platform

> **Tagline:** Understand Customers. Prevent Avoidable Churn.

RetainIQ is a portfolio-ready web application designed to help businesses analyze customer behavior, predict churn risk with machine learning, investigate underlying behavioral patterns, and simulate data-driven retention campaigns in the **Retention Decision Lab**.

---

## Key Capabilities & Architectural Principles

1. **Strict Relational Persistence (MySQL Server 8.0+ ONLY):**
   - **Zero SQLite Policy:** SQLite is strictly forbidden anywhere in this project (development, automated testing, fallbacks, and production). If MySQL is unreachable, the system halts and presents clear diagnostic guidance rather than silently degrading to SQLite.
   - Built on SQLAlchemy 2.0 with the PyMySQL driver, parameterized queries, and Alembic database migrations.
2. **The 6-Layer Epistemological Framework:**
   - **Layer 1: Observed Historical Data** (Actual customer records in MySQL).
   - **Layer 2: SQL-Calculated Metrics** (Deterministic cohort churn and revenue metrics).
   - **Layer 3: Machine Learning Predictions** (Statistical probabilities from Scikit-learn, clearly labeled as estimates).
   - **Layer 4: User-Defined Assumptions** (Campaign budgets, contact costs, and hypothetical uplift rates).
   - **Layer 5: Simulated Outcomes** (Mathematical projections derived in the Retention Decision Lab).
   - **Layer 6: AI-Generated Explanations** (Grounded natural-language summaries from RetainIQ Analyst).
3. **Signature Feature — Retention Decision Lab:**
   - Interactive scenario simulator comparing competing retention strategies side by side.
   - Computes expected net benefit, total campaign cost, cost per incremental retained customer (CPIR), break-even retention uplift, and 3-case sensitivity (Downside / Base / Upside).
4. **Evidence-Grounded AI Assistant (RetainIQ Analyst):**
   - Answers business questions by referencing verified MySQL queries and Scikit-learn evaluation metrics.
   - Operates with a robust **deterministic fallback** when no LLM API key is configured. Never executes arbitrary SQL, Python, or shell code.

---

## Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 18, Vite, TypeScript, Tailwind CSS, React Router v6, Recharts, Lucide React |
| **Backend** | Python 3.11, FastAPI, Pydantic v2, SQLAlchemy 2.0, PyMySQL |
| **Database** | MySQL Server 8.0+ with Alembic migrations (**STRICTLY NO SQLITE**) |
| **Data & ML** | Pandas, NumPy, Scikit-learn, Joblib |
| **Testing** | Pytest, Vitest |

---

## Project Structure

```text
RetainIQ/
├── backend/
│   ├── alembic/                  # Database migration scripts
│   ├── alembic.ini               # Alembic configuration
│   ├── app/
│   │   ├── api/                  # FastAPI routers and endpoints
│   │   ├── core/                 # MySQL config, security, and SQLite blocker
│   │   ├── database/             # SQLAlchemy engine and session factory
│   │   ├── models/               # 15 Relational entities
│   │   ├── schemas/              # Pydantic v2 validation schemas
│   │   ├── services/
│   │   │   ├── ai/               # RetainIQ Analyst grounded assistant
│   │   │   ├── analytics/        # Parameterized MySQL analytics engine
│   │   │   ├── churn_model/      # Scikit-learn Random Forest ML pipeline
│   │   │   ├── decision_lab/     # Scenario simulator and sensitivity calculations
│   │   │   └── import_service.py # CSV import and data quality scanner
│   │   ├── tests/                # Automated pytest suite (against MySQL test db)
│   │   └── main.py               # FastAPI application entrypoint
│   ├── models_storage/           # Serialized Joblib ML models
│   ├── sql/
│   │   └── init.sql              # MySQL initialization script
│   ├── requirements.txt          # Python dependencies
│   ├── seed_demo_data.py         # Demo workspace seeder
│   └── pytest.ini                # Pytest configuration
├── frontend/
│   ├── src/
│   │   ├── components/           # Navbar, Sidebar, StatCards, RiskBadges
│   │   ├── pages/                # 16 Complete application pages
│   │   ├── services/             # Type-safe API client
│   │   ├── types/                # TypeScript interface definitions
│   │   ├── App.tsx               # Routing and ProtectedRoute wrapper
│   │   └── main.tsx              # React DOM entrypoint
│   ├── package.json              # NPM dependencies
│   └── vite.config.ts            # Vite proxy configuration
├── docs/
│   ├── sql-analytics.md          # SQL metric formulations and queries
│   └── decision-lab-methodology.md # Decision Lab mathematical formulas
├── sample_data/
│   ├── generate_sample_data.py   # Synthetic Telco dataset generator
│   └── telco_customer_churn.csv  # 1,000 benchmark customer records
├── .env.example                  # Environment template
└── README.md
```

---

## Beginner-Friendly Quick Start Guide (Windows PowerShell)

### Prerequisites

Ensure you have installed:
- **Python 3.11+**: `python --version`
- **Node.js 18+ & npm**: `node --version`, `npm --version`
- **MySQL Server 8.0+**: Ensure the `MySQL80` service is running:
  ```powershell
  Get-Service -Name MySQL80
  # If stopped:
  Start-Service -Name MySQL80
  ```

---

### Step 1: Database Setup (MySQL 8.0)

Initialize the application databases and dedicated user using the provided initialization script:

```powershell
# Run using MySQL root CLI (replace 'root' password if different)
Get-Content backend\sql\init.sql | & "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u root -proot
```

This creates:
- `retainiq_db`: Primary application database
- `retainiq_test_db`: Isolated automated test database
- `retainiq_user`: Dedicated application user (`retainiq_pass_2026!`) with restricted privileges

---

### Step 2: Backend Virtual Environment & Migrations

```powershell
# Navigate to the backend directory
cd backend

# Create Python virtual environment
python -m venv venv

# Activate virtual environment
.\venv\Scripts\Activate.ps1

# Install backend dependencies
pip install -r requirements.txt

# Run Alembic migrations to construct all 15 relational tables
alembic upgrade head

# Seed demo workspace (creates demo user, 1,000 customers, ML model v1.0, and 2 Decision Lab scenarios)
python seed_demo_data.py
```

---

### Step 3: Run Automated Test Suite

RetainIQ includes a comprehensive automated test suite executed directly against MySQL (`retainiq_test_db`):

```powershell
# From the backend directory with virtual environment activated:
pytest -v
```

**Expected Result:** `14 passed in ~5.0s` verifying MySQL connectivity, CSV import errors, parameterized SQL metrics, ML train/test isolation, Decision Lab mathematical formulas, grounded AI fallback, and REST endpoints.

---

### Step 4: Frontend Installation & Build

Open a second PowerShell window:

```powershell
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Build for production verification
npm run build
```

---

### Step 5: Start the Application

#### Option A: 1-Click Launchers (Easiest)
- **Windows File Explorer:** Double-click [`start-retainiq.bat`](file:///c:/Users/khush/OneDrive/Documents/Desktop/RetainIQ/start-retainiq.bat) in the project root.
- **PowerShell:**
  ```powershell
  .\start-retainiq.ps1
  ```
*This verifies the MySQL80 service, starts both backend and frontend in separate persistent windows, and opens your browser directly to the login page.*

#### Option B: Manual Terminal Launch
##### Terminal 1 — Start Backend Server:
```powershell
cd backend
.\venv\Scripts\Activate.ps1
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
*API Documentation will be accessible at: `http://127.0.0.1:8000/docs`*

##### Terminal 2 — Start Frontend Server:
```powershell
cd frontend
npm run dev -- --host 127.0.0.1 --port 5173
```
*Web Application will be accessible at: `http://127.0.0.1:5173/`*

#### Option C: Docker Compose (Single Command)
If you have Docker Desktop installed, launch MySQL 8.0, FastAPI backend, and Nginx frontend in isolated containers:
```powershell
docker compose up --build
```
*Web Application will be accessible at `http://localhost:5173/`.*

---

## Exploring the Platform

1. **1-Click Demo Login:**
   - Open `http://127.0.0.1:5173/login`.
   - Click **"1-Click Demo Login (Alex Mercer • Lead Analyst)"** to sign in instantly with credentials:
     - **Email:** `demo@retainiq.io`
     - **Password:** `RetainIQ2026!`
2. **Dashboard (`/app/dashboard`):**
   - Review live MySQL KPI summaries: 1,000 customers, 44% observed churn rate, $66,852 MRR, and $26,875 monthly revenue at risk.
3. **Customer Directory (`/app/customers`):**
   - Search, filter by risk tier, and click any customer row to inspect their contract, tenure, services, and predictive model churn probability score.
4. **Data Import (`/app/import`):**
   - Upload any CSV customer dataset. The system sniffs headers, maps fields, performs transactional row-by-row validation, and reports errors with exact line numbers.
5. **Machine Learning Workspace (`/app/models`):**
   - Review active Random Forest model version `v1.0`. Inspect ROC-AUC, Precision, Recall, confusion matrix, and feature importances (e.g. Month-to-month contracts and fiber optic internet).
6. **Retention Decision Lab (`/app/decision-lab`):**
   - Compare **Strategy A** (High-Risk Discount Outreach) vs. **Strategy B** (Proactive Check-In Call).
   - Adjust budget, contact cost, or assumed retention uplift to observe instant recalculation of Net Benefit, Break-Even Uplift, and 3-case sensitivity.
7. **RetainIQ Analyst AI (`/app/assistant`):**
   - Ask natural language questions like: *"Which customer segment has the highest observed churn rate?"*
   - See grounded responses citing MySQL metrics (e.g., Month-to-month + Fiber Optic at 67.05% churn) along with transparent causal limitations.
8. **Settings & MySQL (`/app/settings`):**
   - Inspect live MySQL 8.0 connection status (`localhost:3306`, database `retainiq_db`) and verify the Zero SQLite Policy banner.

---

## Troubleshooting & FAQ

### MySQL Service Not Running
- **Symptom:** `Can't connect to MySQL server on 'localhost:3306'`
- **Resolution:** Start the MySQL Windows service:
  ```powershell
  Start-Service -Name MySQL80
  ```

### Resetting the Demo Database
- If you wish to wipe and restore clean benchmark data:
  ```powershell
  cd backend
  python seed_demo_data.py
  ```

### Optional LLM Integration
- The platform functions out of the box with intelligent rule-based deterministic responses.
- To enable generative LLM features, add your API key in `backend/.env`:
  ```env
  LLM_API_KEY=your_gemini_or_openai_key
  LLM_MODEL=gemini-2.0-flash
  ```

---

## License & Attribution

Designed and engineered as a comprehensive portfolio platform for customer retention intelligence. Built with strict data integrity, zero synthetic fabrication, and transparent decision science.
