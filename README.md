# VELTRIX AI
**BEYOND INTELLIGENCE**

A bilingual (Persian/English) AI-assisted 2D Game Studio MVP.

## Current capabilities
- Next.js frontend with a Phaser 3 playable prototype preview.
- FastAPI backend with structured game-design generation.
- OpenAI-compatible chat-completions integration.
- Rule-based fallback when no API key is configured.
- Persian and English prompt handling.

## Configure the AI
1. Open the `backend` folder.
2. Copy `.env.example` to `.env`.
3. Add your API key to `OPENAI_API_KEY`.
4. Optionally set `AI_BASE_URL` and `AI_MODEL` for another OpenAI-compatible provider.
5. Keep `.env` private; never commit API keys.

## Run locally
### Backend
```bash
cd backend
python -m venv .venv
# Activate the virtual environment
pip install -r requirements.txt
uvicorn main:app --reload
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:3000. By default, the frontend calls http://localhost:8000.
For a deployed API, set `NEXT_PUBLIC_API_URL` to its `/generate` endpoint.

## Important limitations
The AI currently generates a structured game design, while the Phaser preview still uses the two starter gameplay templates (coin collector and dodge). It does not yet generate arbitrary game code or build Android APK files.
