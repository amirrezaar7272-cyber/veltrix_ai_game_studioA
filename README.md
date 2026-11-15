# VELTRIX AI
**BEYOND INTELLIGENCE**

A bilingual (Persian/English) AI-assisted 2D game studio MVP.

## Stack
- Frontend: Next.js + React + Phaser 3
- Backend: FastAPI + Python
- Current prototype: prompt-to-game configuration using two templates (coin collector and dodge)

## Run locally
### Backend
`cd backend`
`python -m venv .venv`
Activate the environment, then:
`pip install -r requirements.txt`
`uvicorn main:app --reload`

### Frontend
`cd frontend`
`npm install`
`npm run dev`

Open http://localhost:3000. The frontend expects the API at http://localhost:8000.
