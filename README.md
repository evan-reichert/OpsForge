# OpsForge

<p align="center">
  <strong>AI-powered operational analytics for CSV ticket/report uploads</strong><br/>
  Upload your data, detect issue patterns, score organizational health, and get actionable recommendations.
</p>

---

## ✨ What OpsForge Covers

OpsForge is a full-stack analytics dashboard designed for IT/operations datasets (helpdesk tickets, incident exports, support logs, etc.).

### Current capabilities
- 📤 **CSV Upload Pipeline** with backend validation and parsing
- 📊 **Issue Categorization + Bar Chart Visualization**
- 🧠 **AI Interpretation (GPT-4o-mini)** with structured report summary
- 💬 **Organizational Advice** generated from dataset-specific trends
- ❤️ **Operational Health Score** with qualitative labels (Critical → Excellent)
- 🧮 **Metrics & data quality checks** (missing values, duplicates, outliers, numeric stats)
- 🗄️ **PostgreSQL-backed report history** for reopening dashboards in the Past Reports tab

### Product direction (planned)
- 🗂️ **Past Reports Tab with historical dashboards**
  - Users will be able to open previously uploaded reports
  - Revisit prior metrics, charts, health scores, and advice
  - Compare how organizational health evolves over time

---

## 🧱 Tech Stack

- **Frontend:** React + TypeScript + Vite + Recharts + Bootstrap
- **Backend:** FastAPI + Pandas + OpenAI SDK
- **Language runtimes:** Node.js + Python

---

## ✅ Requirements

Install the following before starting:

- **Node.js** 18+ (recommended 20+)
- **npm** 9+
- **Python** 3.12+ (project currently running on 3.13 is supported)
- **pip** (bundled with Python)
- **virtualenv/venv** support

Optional but recommended:
- OpenAI API key (for AI-powered interpretation/advice)

---

## 🚀 Quick Start

### 1) Clone and enter project

```bash
git clone <your-repo-url>
cd OpsForge
```

### 2) Backend setup (FastAPI)

```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

Create a `.env` file in the project root (or copy from `.env.example`) and set:

```env
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-4o-mini
VITE_API_BASE_URL=http://127.0.0.1:8000
DATABASE_URI=postgresql+psycopg://postgres:postgres@localhost:5432/opsforge
```

> `DATABASE_URI` is the primary database setting. For local development only, if no DB env var is set, OpsForge falls back to `opsforge.db` (SQLite).
> In deployment/production environments (including Vercel), `DATABASE_URI` is required.

Start backend:

```bash
uvicorn main:app --reload
```

Backend default URL: `http://127.0.0.1:8000`

### 3) Frontend setup (Vite)

In a second terminal:

```bash
npm install
npm run dev
```

Frontend default URL: `http://localhost:5173`

---

## 🧪 How to Use

1. Open the Upload tab.
2. Select a CSV file.
3. Click **Generate Report**.
4. Review:
   - KPI cards (health/issues/rows/columns)
   - issue distribution bar chart
   - AI-generated report summary and advice

---

## 🔐 Environment Notes

- If `OPENAI_API_KEY` is missing, OpsForge still works using heuristic fallback logic.
- Ensure frontend and backend are both running.
- CORS is configured for localhost/127.0.0.1 development origins.
- Database env precedence is: `DATABASE_URI` → `DATABASE_URL`.
- For Vercel, set `DATABASE_URI` in Project Settings → Environment Variables to your managed Postgres connection string.

---

## ▲ Deploying with Vercel (database)

1. Provision a managed PostgreSQL database (for example: Vercel Postgres, Neon, Supabase, Railway, Render).
2. In Vercel Project Settings, add:
  - `DATABASE_URI` = your Postgres URI
  - `OPENAI_API_KEY` (if using AI mode)
3. Ensure `DATABASE_URI` uses one of these forms (both are supported):
  - `postgresql+psycopg://...`
  - `postgresql://...` (auto-normalized at runtime)

OpsForge will auto-create the `reports` table on backend startup.

---

## 🛠️ Troubleshooting

- **`ModuleNotFoundError`** on backend start: verify imports use local modules (for example, `from model import ...`).
- **Upload fails / fetch error:** confirm backend is running at `http://127.0.0.1:8000` and frontend `VITE_API_BASE_URL` points there.
- **No AI output:** check `OPENAI_API_KEY` and internet connectivity.
- **Port conflict:** run Vite or Uvicorn on a different port and update env values accordingly.

---

## 📌 Roadmap Snapshot

- [x] AI report + advice generation
- [x] Operational health scoring
- [x] Enhanced keyword-based category detection
- [ ] **Past Reports history with dashboard replay**
- [ ] Persistent storage for uploaded analyses
- [ ] Trend comparison across reports/time windows
