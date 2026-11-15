"use client";

import { useState } from "react";
import GamePreview from "../components/GamePreview";

type Result = {
  template: string; title: string; description: string; objective: string;
  difficulty: string; theme: string; generation_mode: "ai" | "template_fallback"; note: string;
};

export default function Home() {
  const [prompt, setPrompt] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function generate() {
    if (!prompt.trim()) return;
    setBusy(true); setError(""); setResult(null);
    try {
      const response = await fetch(process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/generate", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, language: /[\u0600-\u06FF]/.test(prompt) ? "fa" : "en" })
      });
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.detail || "API request failed");
      }
      setResult(await response.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not reach the VELTRIX API.");
    } finally { setBusy(false); }
  }

  return <main className="shell">
    <header><div className="brand">VELTRIX <span>AI</span></div><div className="tag">BEYOND INTELLIGENCE</div></header>
    <section className="hero">
      <p className="eyebrow">AI GAME STUDIO · MVP</p>
      <h1>Turn your idea into a game.</h1>
      <p className="sub">Describe a 2D game in English or فارسی. VELTRIX turns your idea into a game design.</p>
      <textarea value={prompt} onChange={e => setPrompt(e.target.value)} placeholder="Example: Make a game where a small robot collects glowing coins..." />
      <button onClick={generate} disabled={busy || !prompt.trim()}>{busy ? "Designing..." : "Generate game"}</button>
      {error && <p className="error">{error}</p>}
    </section>
    {result && <section className="result">
      <div>
        <p className="eyebrow">{result.generation_mode === "ai" ? "AI GENERATED DESIGN" : "TEMPLATE PREVIEW"}</p>
        <h2>{result.title}</h2><p>{result.description}</p>
        <p><strong>Objective:</strong> {result.objective}</p>
        <p><strong>Difficulty:</strong> {result.difficulty} · <strong>Theme:</strong> {result.theme}</p>
        <small>{result.note}</small>
      </div>
      <GamePreview template={result.template} />
    </section>}
    <footer>VELTRIX AI · BEYOND INTELLIGENCE</footer>
  </main>;
}
