# OpsForge

<p align="center">
	<strong>AI-powered operations analytics dashboard</strong><br/>
	Upload CSV exports, detect issue patterns, score health, and generate actionable recommendations.
</p>

<p align="center">
	<img alt="React" src="https://img.shields.io/badge/Frontend-React%20%2B%20TypeScript-61dafb?logo=react&logoColor=white" />
	<img alt="FastAPI" src="https://img.shields.io/badge/Backend-FastAPI-009688?logo=fastapi&logoColor=white" />
	<img alt="PostgreSQL" src="https://img.shields.io/badge/Database-PostgreSQL-336791?logo=postgresql&logoColor=white" />
	<img alt="Vercel" src="https://img.shields.io/badge/Deploy-Vercel-black?logo=vercel" />
</p>

---

I built OpsForge as a portfolio project to show how I approach **real software engineering**: useful product behavior, backend guardrails, and deployable architecture.

## 🚀 What this app does

- 📤 Uploads CSV ticket/incident data
- 🔎 Runs validation and data-quality checks
- 📊 Categorizes issues and visualizes them in charts
- 🧠 Generates AI-assisted analysis + recommendations
- 🛟 Falls back to heuristic logic when AI is unavailable
- ❤️ Scores operational health from `Critical` to `Excellent`
- 🗂️ Saves report history and reopens prior dashboards

---

## 🧱 Tech stack

### Frontend
- React
- TypeScript
- Vite
- Recharts
- Bootstrap + custom CSS

### Backend
- FastAPI
- Pandas
- SQLAlchemy
- PostgreSQL (production)
- OpenAI SDK
- SlowAPI (rate limiting)

---

## 🔄 Architecture flow

1. User uploads a CSV.
2. Backend validates file type, size, and row count.
3. Dataset is cleaned and analyzed.
4. AI (or fallback heuristics) produces report output.
5. Result is stored and returned to the dashboard.

---

## 💻 Local run

### Prerequisites
- Node.js 18+
- npm 9+
- Python 3.12+

### Backend
```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload
```

### Frontend
```bash
npm install
npm run dev
```

- Frontend: `http://localhost:5173`
- Backend: `http://127.0.0.1:8000`

---

## ⚙️ Environment variables

I keep runtime config in `.env` locally and Vercel Environment Variables in production.

| Variable | Required | Purpose |
|---|---|---|
| `OPENAI_API_KEY` | Optional* | Enables AI report/advice generation |
| `OPENAI_MODEL` | No | OpenAI model selection (default `gpt-4o-mini`) |
| `DATABASE_URI` | Yes (prod) | SQLAlchemy database connection string |
| `VITE_API_BASE_URL` | Yes (frontend) | API base URL |
| `CORS_ALLOW_ORIGINS` | Yes (prod) | Allowed origins |
| `MAX_UPLOAD_BYTES` | Yes | Max upload size guard |
| `MAX_CSV_ROWS` | Yes | Max rows per upload guard |
| `UPLOAD_RATE_LIMIT` | Yes | Upload rate limiting |

\*If `OPENAI_API_KEY` is not set, OpsForge still works using fallback heuristic analysis.

---

## 🔌 API endpoints

- `GET /` — health message
- `GET /reports` — list saved reports
- `GET /reports/{report_id}` — load one saved report
- `POST /upload` — upload and analyze CSV

---

## ▲ Deployment (Vercel)

I deploy with:
- `vercel.json` for routing + security headers
- `api/index.py` as Python serverless entrypoint

In Vercel, I set:
- `OPENAI_API_KEY`
- `DATABASE_URI`
- `CORS_ALLOW_ORIGINS`
- `MAX_UPLOAD_BYTES`
- `MAX_CSV_ROWS`
- `UPLOAD_RATE_LIMIT`

Then I run this smoke test:
1. Valid CSV upload succeeds
2. Oversized file returns `413`
3. Over-row-limit file returns `422`
4. Burst requests trigger `429`
5. Report history loads correctly

---

## 🔐 Security & reliability decisions

- Secrets stay server-side only
- Input limits are enforced in backend (not just UI)
- CORS is explicit for production origins
- Rate limiting helps prevent token abuse
- DB writes are wrapped with rollback-safe error handling

---

## 🧭 Why I built it this way

I wanted this project to reflect how I think as a software engineer: build for real users, protect backend resources, and ship something I can confidently deploy and maintain.

## License

Portfolio and demonstration use.
