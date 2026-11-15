from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI(title="VELTRIX AI API", version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class GamePrompt(BaseModel):
    prompt: str
    language: str = "en"

@app.get("/health")
def health():
    return {"status": "ok", "project": "VELTRIX AI"}

@app.post("/generate")
def generate(payload: GamePrompt):
    text = payload.prompt.lower()
    template = "dodge" if any(word in text for word in ["dodge", "avoid", "فرار", "جا خالی"]) else "coin_collector"
    return {
        "project": "VELTRIX AI",
        "template": template,
        "title": "Dodge Game" if template == "dodge" else "Coin Collector",
        "description": payload.prompt,
        "status": "prototype",
        "note": "This MVP uses rule-based templates. A real LLM and APK builder are planned for later."
    }
