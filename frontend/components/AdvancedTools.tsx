"use client";

import { useEffect, useRef, useState } from "react";
import type { GameEntity, GameScene } from "../lib/project";

type Props = { scene: GameScene; selected?: GameEntity; onPatch: (patch: Partial<GameEntity>) => void; language: "fa" | "en"; projectName: string };
type Keyframe = { id: string; time: number; x: number; y: number; rotation: number; opacity: number; scale: number };
type Node = { id: string; kind: "start" | "move" | "wait" | "sound" | "condition" | "event"; label: string };
type Edge = { from: string; to: string };

const uid = () => typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : "vx-" + Date.now().toString(36) + Math.random().toString(36).slice(2);

export default function AdvancedTools({ scene, selected, onPatch, language, projectName }: Props) {
  const fa = language === "fa";
  const [tab, setTab] = useState<"physics" | "animation" | "audio" | "visual" | "android">("physics");
  const [keys, setKeys] = useState<Keyframe[]>([]);
  const [duration, setDuration] = useState(3);
  const [nodes, setNodes] = useState<Node[]>([{ id: "start", kind: "start", label: "When game starts" }]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [from, setFrom] = useState("start");
  const [to, setTo] = useState("");
  const [audioUrl, setAudioUrl] = useState("");
  const [audioName, setAudioName] = useState("");
  const [audioMode, setAudioMode] = useState<"effect" | "music">("effect");
  const [audioVolume, setAudioVolume] = useState(0.7);
  const [androidName, setAndroidName] = useState("com.veltrix.game");
  const [exportMessage, setExportMessage] = useState("");
  const audioRef = useRef<HTMLAudioElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => () => { if (audioUrl) URL.revokeObjectURL(audioUrl); }, [audioUrl]);

  function addKeyframe() {
    if (!selected) return;
    const time = keys.length ? Math.min(duration, Math.max(...keys.map(k => k.time)) + 0.5) : 0;
    setKeys(old => [...old, { id: uid(), time, x: selected.x, y: selected.y, rotation: selected.rotation ?? 0, opacity: selected.opacity ?? 1, scale: 1 }].sort((a,b) => a.time-b.time));
  }
  function applyKeyframe(key: Keyframe) {
    if (!selected) return;
    onPatch({ x: key.x, y: key.y, rotation: key.rotation, opacity: key.opacity, width: Math.max(1, Math.round(selected.width * key.scale)), height: Math.max(1, Math.round(selected.height * key.scale)) });
  }
  function addNode(kind: Node["kind"]) {
    const labels: Record<Node["kind"], string> = { start: "When game starts", move: "Move object", wait: "Wait", sound: "Play sound", condition: "If condition", event: "On collision" };
    setNodes(old => [...old, { id: uid(), kind, label: labels[kind] }]);
  }
  function connectNodes() {
    if (!from || !to || from === to || edges.some(e => e.from === from && e.to === to)) return;
    setEdges(old => [...old, { from, to }]);
  }
  function loadAudio(file?: File) {
    if (!file) return;
    if (!file.type.startsWith("audio/")) { setExportMessage(fa ? "فقط فایل صوتی انتخاب کن." : "Choose an audio file."); return; }
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl(URL.createObjectURL(file)); setAudioName(file.name); setExportMessage("");
  }
  function exportAndroidKit() {
    const safeName = androidName.trim().toLowerCase();
    if (!/^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$/.test(safeName)) {
      setExportMessage(fa ? "شناسه باید مثل com.example.mygame باشد." : "Use a valid app ID, e.g. com.example.mygame."); return;
    }
    const kit = {
      product: "VELTRIX AI Android Build Kit",
      status: "SOURCE_PACKAGE_ONLY_NOT_AN_APK",
      app: { name: projectName, appId: safeName, version: "1.0.0" },
      engine: "Web application export target",
      project: { sceneName: scene.name, width: scene.width, height: scene.height, entities: scene.entities },
      androidBuildSteps: [
        "Export the complete web production build from the VELTRIX web project.",
        "Create a Capacitor app: npm install @capacitor/core @capacitor/cli @capacitor/android",
        "Run npx cap init with the app name and app ID shown in this manifest.",
        "Set webDir to the production web build directory in capacitor.config.ts.",
        "Run npx cap add android and npx cap sync android.",
        "Open the android folder in Android Studio, install the Android SDK, then Build > Build Bundle(s) / APK(s) > Build APK(s).",
        "Test the APK on real devices before distribution."
      ],
      requirements: ["Node.js", "Android Studio", "Android SDK", "A production web build"],
      note: "This manifest is not an APK. APK compilation requires Android SDK/Gradle and a complete production web build."
    };
    const blob = new Blob([JSON.stringify(kit, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob); const a = document.createElement("a");
    a.href = url; a.download = "veltrix-android-build-kit.json"; a.click(); URL.revokeObjectURL(url);
    setExportMessage(fa ? "کیت راهنمای ساخت اندروید صادر شد؛ این فایل APK نیست." : "Android build kit exported. This file is not an APK.");
  }

  return <section className="vx-advanced">
    <div className="vx-advanced-head"><div><strong>{fa ? "ابزارهای پیشرفته" : "ADVANCED SYSTEMS"}</strong><small>{fa ? "ابزارهای واقعی ویرایش پروژه" : "Project authoring systems"}</small></div></div>
    <nav className="vx-advanced-tabs">
      {([
        ["physics", fa ? "فیزیک" : "Physics"], ["animation", fa ? "تایم‌لاین" : "Timeline"],
        ["audio", fa ? "صدا" : "Audio"], ["visual", fa ? "اسکریپت بصری" : "Visual Logic"],
        ["android", "Android APK"]
      ] as const).map(([id,label]) => <button key={id} className={tab===id?"active":""} onClick={()=>setTab(id)}>{label}</button>)}
    </nav>

    {tab === "physics" && <div className="vx-tool-panel">
      <h4>{fa ? "تنظیمات بدنه فیزیکی" : "Rigid body properties"}</h4>
      {!selected ? <p>{fa ? "ابتدا یک شیء را از صحنه انتخاب کن." : "Select an object in the scene first."}</p> : <>
        <p className="vx-tool-hint">{selected.name} · {fa ? "این پارامترها روی شخصیت انتخاب‌شده اعمال می‌شوند." : "These parameters apply to the selected entity."}</p>
        <label>{fa ? "جرم" : "Mass"} <input type="number" min="0.1" max="1000" step="0.1" value={selected.mass ?? 1} onChange={e=>onPatch({mass:Math.max(.1,Math.min(1000,Number(e.target.value)||1))})}/></label>
        <label>{fa ? "ضریب اصطکاک" : "Friction"} <input type="range" min="0" max="1" step=".05" value={selected.friction ?? .2} onChange={e=>onPatch({friction:Number(e.target.value)})}/><span>{(selected.friction ?? .2).toFixed(2)}</span></label>
        <label>{fa ? "جهندگی / بازگشت" : "Restitution"} <input type="range" min="0" max="1" step=".05" value={selected.restitution ?? .1} onChange={e=>onPatch({restitution:Number(e.target.value)})}/><span>{(selected.restitution ?? .1).toFixed(2)}</span></label>
        <label>{fa ? "مقیاس گرانش" : "Gravity scale"} <input type="range" min="0" max="3" step=".1" value={selected.gravityScale ?? 0} onChange={e=>onPatch({gravityScale:Number(e.target.value)})}/><span>{(selected.gravityScale ?? 0).toFixed(1)}</span></label>
        <label>{fa ? "نوع بدنه" : "Body type"} <select value={selected.bodyType ?? "dynamic"} onChange={e=>onPatch({bodyType:e.target.value as GameEntity["bodyType"]})}><option value="dynamic">Dynamic</option><option value="static">Static</option><option value="kinematic">Kinematic</option></select></label>
        <label className="vx-inline-check"><input type="checkbox" checked={!!selected.isSensor} onChange={e=>onPatch({isSensor:e.target.checked})}/>{fa ? "بدون برخورد فیزیکی (Sensor)" : "Sensor (trigger only)"}</label>
      </>}
      <p className="vx-tool-hint">{fa ? "مقادیر فیزیک در داده شیء ذخیره می‌شوند. برای شبیه‌سازی کامل چندجسمی، حل‌گر برخورد و تست مرحله‌ای هنوز باید توسعه یابد." : "Physics values are stored per entity. A full multi-body solver and collision test suite remain future work."}</p>
    </div>}

    {tab === "animation" && <div className="vx-tool-panel">
      <h4>{fa ? "تایم‌لاین فریم کلیدی" : "Keyframe timeline"}</h4>
      <label>{fa ? "مدت انیمیشن (ثانیه)" : "Duration (seconds)"} <input type="number" min="0.5" max="60" step=".5" value={duration} onChange={e=>setDuration(Math.max(.5,Math.min(60,Number(e.target.value)||3)))}/></label>
      <button disabled={!selected} onClick={addKeyframe}>{fa ? "＋ ثبت فریم از وضعیت فعلی" : "＋ Add keyframe from current pose"}</button>
      <div className="vx-timeline-ruler"><span>0s</span><span>{duration/2}s</span><span>{duration}s</span></div>
      {keys.length===0 && <p>{fa ? "شیء را انتخاب کن و فریم کلیدی بساز." : "Select an object and add keyframes."}</p>}
      {keys.map(k=><div className="vx-keyframe" key={k.id}><span>◆ {k.time.toFixed(1)}s</span><span>X:{Math.round(k.x)} Y:{Math.round(k.y)} · {Math.round(k.rotation)}°</span><button onClick={()=>applyKeyframe(k)}>{fa?"اعمال":"Apply"}</button><button onClick={()=>setKeys(old=>old.filter(x=>x.id!==k.id))}>×</button></div>)}
      <p className="vx-tool-hint">{fa ? "در این نسخه می‌توانی فریم‌ها را ثبت و روی صحنه اعمال کنی؛ پخش خودکار، منحنی easing و ذخیره تایم‌لاین در فایل پروژه هنوز کامل نشده‌اند." : "You can record and apply poses. Playback, easing curves and project-file persistence are not implemented yet."}</p>
    </div>}

    {tab === "audio" && <div className="vx-tool-panel">
      <h4>{fa ? "مدیریت صدای محلی" : "Local audio workspace"}</h4>
      <div className="vx-audio-actions"><button onClick={()=>fileRef.current?.click()}>{fa ? "انتخاب فایل صوتی" : "Import audio file"}</button><input ref={fileRef} hidden type="file" accept="audio/*" onChange={e=>loadAudio(e.target.files?.[0])}/><select value={audioMode} onChange={e=>setAudioMode(e.target.value as "effect"|"music")}><option value="effect">{fa?"افکت صوتی":"Sound effect"}</option><option value="music">{fa?"موسیقی پس‌زمینه":"Background music"}</option></select></div>
      {audioName && <><p>{audioName}</p><audio ref={audioRef} src={audioUrl} controls loop={audioMode==="music"} /></>}
      <label>{fa?"بلندی صدا":"Volume"} <input type="range" min="0" max="1" step=".05" value={audioVolume} onChange={e=>{const v=Number(e.target.value);setAudioVolume(v);if(audioRef.current)audioRef.current.volume=v;}}/></label>
      <p className="vx-tool-hint">{fa ? "فایل صوتی در این نشست مرورگر پخش می‌شود؛ هنوز داخل پروژه بسته‌بندی یا در بازی به رویدادها متصل نمی‌شود." : "Audio plays in this browser session; embedding it in project exports and triggering it from game events are not wired yet."}</p>
    </div>}

    {tab === "visual" && <div className="vx-tool-panel">
      <h4>{fa ? "سازنده منطق گره‌ای" : "Node-based logic builder"}</h4>
      <div className="vx-node-add">{(["event","move","wait","sound","condition"] as Node["kind"][]).map(kind=><button key={kind} onClick={()=>addNode(kind)}>＋ {kind}</button>)}</div>
      <div className="vx-node-list">{nodes.map(node=><div className="vx-node" key={node.id}><strong>{node.kind.toUpperCase()}</strong><span>{node.label}</span><button onClick={()=>{setNodes(old=>old.filter(n=>n.id!==node.id));setEdges(old=>old.filter(e=>e.from!==node.id&&e.to!==node.id));}}>×</button></div>)}</div>
      <div className="vx-connect"><select value={from} onChange={e=>setFrom(e.target.value)}>{nodes.map(n=><option key={n.id} value={n.id}>{n.label}</option>)}</select><span>→</span><select value={to} onChange={e=>setTo(e.target.value)}><option value="">To node…</option>{nodes.map(n=><option key={n.id} value={n.id}>{n.label}</option>)}</select><button onClick={connectNodes}>{fa?"اتصال":"Connect"}</button></div>
      <ul className="vx-edge-list">{edges.map((edge,i)=><li key={i}>{nodes.find(n=>n.id===edge.from)?.label} → {nodes.find(n=>n.id===edge.to)?.label}</li>)}</ul>
      <p className="vx-tool-hint">{fa ? "گره‌ها و اتصال‌ها در ویرایشگر ساخته می‌شوند؛ مفسر اجرایی گراف و اتصال رویدادها به موتور بازی هنوز پیاده‌سازی نشده است." : "Nodes and links can be authored; graph execution and runtime event bindings are not implemented yet."}</p>
    </div>}

    {tab === "android" && <div className="vx-tool-panel">
      <h4>{fa ? "بسته آماده‌سازی اندروید" : "Android packaging"}</h4>
      <p>{fa ? "شناسه برنامه را تعیین کن و فایل راهنمای ساخت پروژه اندروید را دریافت کن." : "Choose an Android application ID and export the build manifest."}</p>
      <label>{fa?"شناسه برنامه":"Application ID"} <input value={androidName} onChange={e=>setAndroidName(e.target.value)} placeholder="com.example.mygame"/></label>
      <button onClick={exportAndroidKit}>{fa?"دریافت کیت ساخت اندروید":"Export Android build kit"}</button>
      <p className="vx-tool-hint">{fa ? "این خروجی APK نیست. برای ساخت APK واقعی به فایل‌های build وب، Android Studio، Android SDK و Gradle نیاز است. ساخت APK مستقیماً روی گوشی از داخل این صفحه انجام نمی‌شود." : "This is not an APK. A real APK requires the web production build, Android Studio, Android SDK and Gradle. This page cannot compile an APK on-device."}</p>
    </div>}
    {exportMessage && <p className="vx-tool-message" role="status">{exportMessage}</p>}
  </section>;
}
