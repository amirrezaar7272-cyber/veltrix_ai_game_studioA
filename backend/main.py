import json
import os
import re
from typing import Literal

import httpx
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

app = FastAPI(title="VELTRIX AI API", version="0.2.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("FRONTEND_ORIGINS", "http://localhost:3000").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class GamePrompt(BaseModel):
    prompt: str = Field(min_length=3, max_length=2000)
    language: Literal["fa", "en"] = "en"

class GameDesign(BaseModel):
    template: Literal["coin_collector", "dodge"]
    title: str
    description: str
    objective: str
    difficulty: Literal["easy", "medium", "hard"]
    theme: str

def fallback_design(prompt: str, language: str) -> dict:
    lowered = prompt.lower()
    dodge_words = ["dodge", "avoid", "escape", "فرار", "جاخالی", "جا خالی", "مانع"]
    template = "dodge" if any(word in lowered for word in dodge_words) else "coin_collector"
    if language == "fa":
        return {
            "template": template,
            "title": "بازی جاخالی" if template == "dodge" else "جمع‌آوری سکه",
            "description": prompt,
            "objective": "از موانع دوری کن و زنده بمان." if template == "dodge" else "همه سکه‌ها را جمع‌آوری کن.",
            "difficulty": "medium",
            "theme": "آرکید"
        }
    return {
        "template": template,
        "title": "Dodge Runner" if template == "dodge" else "Coin Collector",
        "description": prompt,
        "objective": "Avoid obstacles and survive." if template == "dodge" else "Collect all the coins.",
        "difficulty": "medium",
        "theme": "Arcade"
    }

async def ask_model(prompt: str, language: str) -> dict | None:
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        return None

    base_url = os.getenv("AI_BASE_URL", "https://api.openai.com/v1").rstrip("/")
    model = os.getenv("AI_MODEL", "gpt-4o-mini")
    system = (
        "You are VELTRIX AI, a professional 2D game designer. "
        "Convert the user's idea into a concise playable prototype design. "
        "Return ONLY valid JSON with keys: template (coin_collector or dodge), "
        "title, description, objective, difficulty (easy/medium/hard), theme. "
        "Do not return markdown. Keep the design suitable for a simple 2D arcade prototype. "
        "Write all text fields in Persian." if language == "fa" else
        "You are VELTRIX AI, a professional 2D game designer. "
        "Convert the user's idea into a concise playable prototype design. "
        "Return ONLY valid JSON with keys: template (coin_collector or dodge), "
        "title, description, objective, difficulty (easy/medium/hard), theme. "
        "Do not return markdown. Keep the design suitable for a simple 2D arcade prototype. "
        "Write all text fields in English."
    )
    async with httpx.AsyncClient(timeout=35.0) as client:
        response = await client.post(
            f"{base_url}/chat/completions",
            headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
            json={
                "model": model,
                "temperature": 0.7,
                "response_format": {"type": "json_object"},
                "messages": [
                    {"role": "system", "content": system},
                    {"role": "user", "content": prompt}
                ]
            }
        )
        response.raise_for_status()
        content = response.json()["choices"][0]["message"]["content"]
        content = re.sub(r"^\s*```(?:json)?|\s*```\s*$", "", content.strip())
        return GameDesign.model_validate(json.loads(content)).model_dump()

@app.get("/health")
def health():
    return {
        "status": "ok",
        "project": "VELTRIX AI",
        "ai_configured": bool(os.getenv("OPENAI_API_KEY")),
        "model": os.getenv("AI_MODEL", "gpt-4o-mini")
    }

@app.post("/generate")
async def generate(payload: GamePrompt):
    try:
        design = await ask_model(payload.prompt, payload.language)
        mode = "ai"
        if design is None:
            design = fallback_design(payload.prompt, payload.language)
            mode = "template_fallback"
        return {
            "project": "VELTRIX AI",
            **design,
            "status": "prototype",
            "generation_mode": mode,
            "note": "Generated with the configured language model." if mode == "ai"
                    else "Template mode is active. Add OPENAI_API_KEY to enable AI design generation."
        }
    except (httpx.HTTPError, ValueError, KeyError, TypeError) as exc:
        raise HTTPException(status_code=502, detail=f"AI generation failed: {str(exc)[:240]}")
