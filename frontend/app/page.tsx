"use client";

import { useEffect, useState } from "react";
import GamePreview from "../components/GamePreview";
import StudioWorkspace from "../components/StudioWorkspace";
import { getDeviceProfile, thinkLocally, thinkWithModel, type BrainProgress, type DeviceProfile } from "../lib/localBrain";
import { BUILD_COST, consumeBuildTokens, readWallet, redeemWalletCode, type WalletState } from "../lib/tokenWallet";

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
  const [deviceProfile, setDeviceProfile] = useState<DeviceProfile>({ mode: "light", reason: "Checking device capabilities..." });
  const [wallet, setWallet] = useState<WalletState>({ balance: 0, usedCodes: [] });
  const [walletReady, setWalletReady] = useState(false);
  const [redeemInput, setRedeemInput] = useState("");
  const [walletMessage, setWalletMessage] = useState("");
  const [redeeming, setRedeeming] = useState(false);
  useEffect(() => { setDeviceProfile(getDeviceProfile()); setWallet(readWallet()); setWalletReady(true); }, []);

  async function redeem() {
    if (redeeming) return;
    setRedeeming(true);
    try { const result = await redeemWalletCode(redeemInput); setWallet(result.wallet); setWalletMessage(result.message); if (result.message.includes("اضافه شد") || result.message.includes("نامحدود")) setRedeemInput(""); }
    catch { setWalletMessage("فعال‌سازی رمز انجام نشد؛ دوباره تلاش کن."); }
    finally { setRedeeming(false); }
  }

  async function generate() {
    if (!prompt.trim()) return;
    if (!walletReady) { setWalletMessage("کیف پول هنوز آماده نشده است."); return; }
    if (wallet.balance !== null && wallet.balance < BUILD_COST) { setWalletMessage("برای ساخت بازی حداقل ۱۰ توکن لازم داری. ابتدا یک رمز معتبر وارد کن."); return; }
    setBusy(true); setResult(null); setModelError("");
    setProgress({ progress: 0, text: "Preparing the on-device brain..." });
    try {
      const generated = await thinkWithModel(prompt, setProgress);
      const charged = consumeBuildTokens(wallet, BUILD_COST);
      if (!charged) { setWalletMessage("اعتبار کافی برای تکمیل ساخت وجود ندارد."); return; }
      setWallet(charged); setWalletMessage("ساخت بازی انجام شد؛ ۱۰ توکن مصرف شد."); setResult(generated);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Local model unavailable";
      setModelError(message);
      const generated = thinkLocally(prompt);
      const charged = consumeBuildTokens(wallet, BUILD_COST);
      if (!charged) { setWalletMessage("اعتبار کافی برای تکمیل ساخت وجود ندارد."); return; }
      setWallet(charged); setWalletMessage("ساخت با موتور سبک محلی انجام شد؛ ۱۰ توکن مصرف شد."); setResult(generated);
    } finally { setBusy(false); }
  }

  return <main className="shell">
    <header><div className="brand">VELTRIX <span>AI</span></div><div className="tag">BEYOND INTELLIGENCE</div></header>
    <section className="hero">
      <p className="eyebrow">AI GAME STUDIO · ADAPTIVE LOCAL BRAIN</p>
      <h1>Ideas become games. On your device.</h1>
      <p className="sub">Describe a 2D game in Persian or English. VELTRIX checks this device before loading its local language model. No AI API, API key or paid server is used.</p>
      <section className="wallet-panel" aria-label="Token wallet" dir="rtl">
        <div className="wallet-top"><div><strong>کیف پول VELTRIX</strong><span>{walletReady ? (wallet.balance === null ? "اعتبار نامحدود" : wallet.balance + " توکن") : "در حال بارگذاری..."}</span></div><small>هزینه هر ساخت: ۱۰ توکن</small></div>
        <div className="wallet-redeem"><input value={redeemInput} onChange={event => setRedeemInput(event.target.value)} placeholder="رمز یک‌بارمصرف را وارد کن" autoComplete="off" spellCheck={false} /><button onClick={() => void redeem()} disabled={!walletReady || redeeming || !redeemInput.trim()}>{redeeming ? "..." : "فعال‌سازی رمز"}</button></div>
        {walletMessage && <p className="wallet-message" role="status">{walletMessage}</p>}
        <p className="wallet-note">رمز پس از فعال‌سازی در همین مرورگر دوباره پذیرفته نمی‌شود. این نسخه محلی است؛ یک‌بارمصرف سراسری و جلوگیری از دست‌کاری اعتبار به سرور امن نیاز دارد.</p>
      </section>
      <div className="model-info">
        <strong>{deviceProfile.mode === "standard" ? "STANDARD DEVICE PROFILE · QWEN 2.5 · 0.5B" : "LIGHT DEVICE PROFILE · NO LARGE MODEL DOWNLOAD"}</strong>
        <span>{deviceProfile.reason} First model setup, when supported, needs internet and roughly 1 GB of free storage. Model execution still depends on the GPU and browser.</span>
      </div>
      <textarea value={prompt} onChange={e => setPrompt(e.target.value)} placeholder="مثلاً: یک بازی فضایی بساز که ربات از شهاب‌سنگ‌ها فرار کند و کریستال جمع کند..." />
      <button onClick={generate} disabled={busy || !prompt.trim() || !walletReady || (wallet.balance !== null && wallet.balance < BUILD_COST)}>{busy ? "Loading local brain..." : "Generate with local AI"}</button>
      {busy && <div className="progress"><div className="progress-track"><div className="progress-fill" style={{ width: progress.progress + "%" }} /></div><small>{progress.text} {progress.progress > 0 ? progress.progress + "%" : ""}</small></div>}
      {modelError && <p className="model-warning">حالت سبک فعال شد: {modelError}</p>}
    </section>
    <StudioWorkspace initialDesign={result ? { title: result.title, description: result.description, theme: result.theme, template: result.template } : undefined} />
    {result && <section className="result">
      <div>
        <p className="eyebrow">VELTRIX ON-DEVICE BRAIN</p>
        <h2>{result.title}</h2><p>{result.description}</p>
        <p><strong>Objective:</strong> {result.objective}</p>
        <p><strong>Difficulty:</strong> {result.difficulty} · <strong>Theme:</strong> {result.theme}</p>
        <small>{result.note}</small>
      </div>
      <GamePreview template={result.template} theme={result.theme} />
    </section>}
    <footer>VELTRIX AI · BEYOND INTELLIGENCE · YOUR PROMPTS STAY ON THIS DEVICE</footer>
  </main>;
}
