# Worddee.ai – Turnkey Assignment Version

## Tech stack
- Frontend: Next.js (App Router)
- Backend: FastAPI + SQLite (worddee.db)
- AI scoring: n8n webhook (with mock fallback)
- Docker: backend + frontend + n8n in one compose

## Endpoints
- GET /api/word – random word of the day
- POST /api/validate-sentence – validate a sentence, returns score & feedback
- GET /api/summary – dashboard stats
- GET /api/history – recent practice sessions

JSON format for feedback:

```json
{
  "score": 8.5,
  "level": "Beginner",
  "suggestion": "Try using adjectives to expand your sentence.",
  "corrected_sentence": "The airport runway is under reconstruction to improve safety."
}
```

## Run with Docker (recommended)

In the folder that contains `docker-compose.yml`:

```bash
docker compose up -d --build
```

Then open:

- Word of the Day: http://localhost:3000/word-of-the-day
- Dashboard: http://localhost:3000/dashboard
- API docs: http://localhost:8000/docs
- n8n: http://localhost:5678

## Run locally without Docker

Backend:

```bash
cd api
pip install -r requirements.txt
uvicorn main:app --reload
```

Frontend:

```bash
cd frontend
npm install
npm run dev
```

Make sure backend is running on http://localhost:8000 before using the frontend.
