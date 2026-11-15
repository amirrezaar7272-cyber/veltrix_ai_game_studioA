"use client";

import { useState } from "react";
import GamePreview from "../components/GamePreview";

type Result = { template: string; title: string; description: string; status: string; note: string };

export default function Home() {
  const [prompt, setPrompt] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function generate() {
    if (!prompt.trim()) return;
    setBusy(true); setError(""); setResult(null);
    try {
      const response = await fetch("http://localhost:8000/generate", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, language: /[\u0600-\u06FF]/.test(prompt) ? "fa" : "en" })
      });
      if (!response.ok) throw new Error("API request failed");
      setResult(await response.json());
    } catch {
      setError("Could not reach the API. Start the FastAPI backend on port 8000.");
    } finally { setBusy(false); }
  }

  return <main className="shell">
    <header><div className="brand">VELTRIX <span>AI</span></div><div className="tag">BEYOND INTELLIGENCE</div></header>
    <section className="hero">
      <p className="eyebrow">AI GAME STUDIO · MVP</p>
      <h1>Turn your idea into a game.</h1>
      <p className="sub">Describe a 2D game in English or فارسی. VELTRIX creates a playable prototype configuration.</p>
      <textarea value={prompt} onChange={e => setPrompt(e.target.value)} placeholder="Example: Make a game where a small robot collects glowing coins..." />
      <button onClick={generate} disabled={busy || !prompt.trim()}>{busy ? "Creating..." : "Generate game"}</button>
      {error && <p className="error">{error}</p>}
    </section>
    {result && <section className="result">
      <div><p className="eyebrow">GENERATED PROTOTYPE</p><h2>{result.title}</h2><p>{result.description}</p><small>{result.note}</small></div>
      <GamePreview template={result.template} />
    </section>}
    <footer>VELTRIX AI · First MVP · 2D Game Studio</footer>
  </main>;
}
