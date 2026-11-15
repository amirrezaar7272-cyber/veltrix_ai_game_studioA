# VELTRIX AI
**BEYOND INTELLIGENCE**

A bilingual (Persian/English) AI-assisted 2D Game Studio MVP.

## Current capabilities
- Next.js frontend with a Phaser 3 playable prototype preview.
- FastAPI backend with structured game-design generation.
- Gemini API through its OpenAI-compatible endpoint.
- Rule-based fallback when no API key is configured.
- Persian and English prompt handling.

## Free deployment plan
- Backend: Render Free Web Service, configured by `render.yaml`.
- Frontend: Vercel Hobby plan, with the Vercel project root set to `frontend`.
- AI: Gemini API free tier, subject to model and account rate limits.

### Deploy backend on Render
1. Sign in to Render and connect GitHub.
2. Choose **New → Blueprint** and select this repository.
3. Render reads `render.yaml`. Keep the service plan set to Free.
4. Add `GEMINI_API_KEY` from Google AI Studio as a secret environment variable.
5. After deployment, copy the service URL (for example `https://your-service.onrender.com`).

Free Render services sleep after 15 minutes without incoming traffic, so the first request after sleep can be slow. Free instances have limited resources and are intended for testing/hobby use.

### Deploy frontend on Vercel
1. Import this GitHub repository into Vercel.
2. Set **Root Directory** to `frontend`.
3. Add environment variable `NEXT_PUBLIC_API_URL` with the full backend endpoint, e.g. `https://your-service.onrender.com/generate`.
4. Deploy.

### Connect frontend to backend
After Vercel gives you a public site URL, return to Render and set `FRONTEND_ORIGINS` to that exact URL (for example `https://your-project.vercel.app`). Redeploy the backend if required.

### Get a Gemini API key
Create a key in Google AI Studio: https://aistudio.google.com/app/apikey
Keep it secret. Do not put it in frontend code or commit it to GitHub.

## Run locally
Backend:
```bash
cd backend
python -m venv .venv
pip install -r requirements.txt
uvicorn main:app --reload
```

Frontend:
```bash
cd frontend
npm install
npm run dev
```

## Important limitations
The AI generates a structured game design, while the Phaser preview still uses two starter gameplay templates (coin collector and dodge). Arbitrary game-code generation and Android APK building are not implemented yet.
