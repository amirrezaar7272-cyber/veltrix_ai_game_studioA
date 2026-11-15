"use client";

import { useState } from "react";
import GamePreview from "../components/GamePreview";
import { thinkLocally } from "../lib/localBrain";

type Result = {
  template: string; title: string; description: string; objective: string;
  difficulty: string; theme: string;
  generation_mode: "ai" | "template_fallback" | "local_brain";
  note: string;
};

export default function Home() {
  const [prompt, setPrompt] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [busy, setBusy] = useState(false);

  async function generate() {
    if (!prompt.trim()) return;
    setBusy(true); setResult(null);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      if (!apiUrl) throw new Error("Local mode");
      const response = await fetch(`${apiUrl.replace(/\/$/, "")}/generate`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, language: /[\u0600-\u06FF]/.test(prompt) ? "fa" : "en" })
      });
      if (!response.ok) throw new Error("API unavailable");
      setResult(await response.json());
    } catch {
      // Offline-first fallback: the first VELTRIX brain runs in this browser.
      setResult(thinkLocally(prompt));
    } finally {
      setBusy(false);
    }
  }

  return <main className="shell">
    <header><div className="brand">VELTRIX <span>AI</span></div><div className="tag">BEYOND INTELLIGENCE</div></header>
    <section className="hero">
      <p className="eyebrow">AI GAME STUDIO · LOCAL BRAIN 1.0</p>
      <h1>Turn your idea into a game.</h1>
      <p className="sub">Describe a 2D game in English or فارسی. VELTRIX can create a starter design right on this device — no API key or server required.</p>
      <textarea value={prompt} onChange={e => setPrompt(e.target.value)} placeholder="مثلاً: یک بازی بساز که ربات سکه جمع کند..." />
      <button onClick={generate} disabled={busy || !prompt.trim()}>{busy ? "Thinking..." : "Generate game"}</button>
    </section>
    {result && <section className="result">
      <div>
        <p className="eyebrow">{result.generation_mode === "ai" ? "AI GENERATED DESIGN" : result.generation_mode === "local_brain" ? "VELTRIX LOCAL BRAIN" : "TEMPLATE PREVIEW"}</p>
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
