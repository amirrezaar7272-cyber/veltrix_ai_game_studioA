"use client";

import { useState } from "react";
import GamePreview from "../components/GamePreview";
import { getDeviceProfile, thinkLocally, thinkWithModel, type BrainProgress } from "../lib/localBrain";

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
  const [progress, setProgress] = useState<BrainProgress>({ progress: 0, text: "" });
  const [modelError, setModelError] = useState("");
  const deviceProfile = getDeviceProfile();

  async function generate() {
    if (!prompt.trim()) return;
    setBusy(true); setResult(null); setModelError("");
    setProgress({ progress: 0, text: "Preparing the on-device brain..." });
    try {
      setResult(await thinkWithModel(prompt, setProgress));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Local model unavailable";
      setModelError(message);
      setResult(thinkLocally(prompt));
    } finally { setBusy(false); }
  }

  return <main className="shell">
    <header><div className="brand">VELTRIX <span>AI</span></div><div className="tag">BEYOND INTELLIGENCE</div></header>
    <section className="hero">
      <p className="eyebrow">AI GAME STUDIO · ADAPTIVE LOCAL BRAIN</p>
      <h1>Ideas become games. On your device.</h1>
      <p className="sub">Describe a 2D game in Persian or English. VELTRIX checks this device before loading its local language model. No AI API, API key or paid server is used.</p>
      <div className="model-info">
        <strong>{deviceProfile.mode === "standard" ? "STANDARD DEVICE PROFILE · QWEN 2.5 · 0.5B" : "LIGHT DEVICE PROFILE · NO LARGE MODEL DOWNLOAD"}</strong>
        <span>{deviceProfile.reason} First model setup, when supported, needs internet and roughly 1 GB of free storage. Model execution still depends on the GPU and browser.</span>
      </div>
      <textarea value={prompt} onChange={e => setPrompt(e.target.value)} placeholder="مثلاً: یک بازی فضایی بساز که ربات از شهاب‌سنگ‌ها فرار کند و کریستال جمع کند..." />
      <button onClick={generate} disabled={busy || !prompt.trim()}>{busy ? "Loading local brain..." : "Generate with local AI"}</button>
      {busy && <div className="progress"><div className="progress-track"><div className="progress-fill" style={{ width: progress.progress + "%" }} /></div><small>{progress.text} {progress.progress > 0 ? progress.progress + "%" : ""}</small></div>}
      {modelError && <p className="model-warning">حالت سبک فعال شد: {modelError}</p>}
    </section>
    {result && <section className="result">
      <div>
        <p className="eyebrow">VELTRIX ON-DEVICE BRAIN</p>
        <h2>{result.title}</h2><p>{result.description}</p>
        <p><strong>Objective:</strong> {result.objective}</p>
        <p><strong>Difficulty:</strong> {result.difficulty} · <strong>Theme:</strong> {result.theme}</p>
        <small>{result.note}</small>
      </div>
      <GamePreview template={result.template} />
    </section>}
    <footer>VELTRIX AI · BEYOND INTELLIGENCE · YOUR PROMPTS STAY ON THIS DEVICE</footer>
  </main>;
}
