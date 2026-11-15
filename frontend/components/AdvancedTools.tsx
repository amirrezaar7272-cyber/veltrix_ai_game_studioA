"use client";

import { useEffect, useRef, useState } from "react";
import type { AnimationKeyframe, AnimationTrack, AudioAsset, GameEntity, GameScene, LogicNode } from "../lib/project";

type Props = {
  scene: GameScene;
  selected?: GameEntity;
  onPatch: (patch: Partial<GameEntity>) => void;
  onScenePatch: (patch: Partial<GameScene>) => void;
  language: "fa" | "en";
  projectName: string;
};
const uid = () => typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : "vx-" + Date.now().toString(36) + Math.random().toString(36).slice(2);
const nodeKinds: LogicNode["kind"][] = ["start","collision","collect","goal","move","wait","play-audio","set-visible","set-score"];
const ease = (value:number, kind:AnimationKeyframe["easing"]) => kind==="ease-in"?value*value:kind==="ease-out"?1-(1-value)*(1-value):kind==="ease-in-out"?value<.5?2*value*value:1-Math.pow(-2*value+2,2)/2:value;

export default function AdvancedTools({ scene, selected, onPatch, onScenePatch, language, projectName }: Props) {
  const fa = language === "fa";
  const [tab, setTab] = useState<"physics"|"animation"|"audio"|"visual"|"android">("physics");
  const [duration,setDuration]=useState(3);
  const [playing,setPlaying]=useState(false);
  const [playhead,setPlayhead]=useState(0);
  const [audioStatus,setAudioStatus]=useState("");
  const [androidName,setAndroidName]=useState("com.veltrix.game");
  const [exportMessage,setExportMessage]=useState("");
  const [from,setFrom]=useState("");
  const [to,setTo]=useState("");
  const [nodeKind,setNodeKind]=useState<LogicNode["kind"]>("move");
  const [nodeEntity,setNodeEntity]=useState("");
  const [nodeValue,setNodeValue]=useState(100);
  const [nodeAudio,setNodeAudio]=useState("");
  const audioRef=useRef<HTMLAudioElement|null>(null);
  const onPatchRef=useRef(onPatch);
  onPatchRef.current=onPatch;
  const tracks=scene.animationTracks??[];
  const track=tracks.find(item=>item.entityId===selected?.id);
  const keys=track?.keyframes??[];
  const nodes=scene.logicNodes??[];
  const edges=scene.logicEdges??[];
  const assets=scene.audioAssets??[];
  const selectedAudio=assets.find(asset=>asset.id===nodeAudio)??assets[0];

  useEffect(()=>{ if(!playing||!selected||!track||keys.length===0)return; let raf=0;let start=0;const frames=[...keys].sort((a,b)=>a.time-b.time);
    const tick=(now:number)=>{if(!start)start=now;let t=(now-start)/1000;const end=Math.max(track.duration,frames[frames.length-1].time);if(t>end){if(track.loop){start=now;t=0;}else{setPlaying(false);setPlayhead(end);return;}}
      setPlayhead(t);let a=frames[0],b=frames[frames.length-1];for(let i=0;i<frames.length-1;i++){if(t>=frames[i].time&&t<=frames[i+1].time){a=frames[i];b=frames[i+1];break;}}
      const span=Math.max(.0001,b.time-a.time),raw=Math.max(0,Math.min(1,(t-a.time)/span)),ratio=ease(raw,b.easing);
      const lerp=(x:number,y:number)=>x+(y-x)*ratio;
      onPatchRef.current({x:lerp(a.x,b.x),y:lerp(a.y,b.y),width:lerp(a.width,b.width),height:lerp(a.height,b.height),rotation:lerp(a.rotation,b.rotation),opacity:lerp(a.opacity,b.opacity)});
      raf=requestAnimationFrame(tick);
    };raf=requestAnimationFrame(tick);return()=>cancelAnimationFrame(raf);
  },[playing,selected?.id,track?.id]);

  function patchTrack(next:AnimationTrack){onScenePatch({animationTracks:[...tracks.filter(item=>item.entityId!==next.entityId),next]});}
  function addKeyframe(){if(!selected)return;const current=track??{id:uid(),entityId:selected.id,name:selected.name+" animation",duration,loop:false,keyframes:[]};
    const time=Math.min(current.duration,playhead);const key:AnimationKeyframe={id:uid(),time,x:selected.x,y:selected.y,width:selected.width,height:selected.height,rotation:selected.rotation??0,opacity:selected.opacity??1,easing:"linear"};
    patchTrack({...current,duration,keyframes:[...current.keyframes.filter(k=>Math.abs(k.time-time)>.001),key].sort((a,b)=>a.time-b.time)});
  }
  function updateKey(key:AnimationKeyframe,patch:Partial<AnimationKeyframe>){if(!track)return;patchTrack({...track,keyframes:track.keyframes.map(item=>item.id===key.id?{...item,...patch}:item)});}
  function removeKey(id:string){if(track)patchTrack({...track,keyframes:track.keyframes.filter(key=>key.id!==id)});}
  function addAudio(file?:File){if(!file)return;if(assets.length>=2){setAudioStatus(fa?"حداکثر دو فایل صوتی در هر صحنه مجاز است":"At most two audio files per scene");return;}if(!file.type.startsWith("audio/")){setAudioStatus(fa?"فایل صوتی معتبر نیست":"Unsupported audio file");return;}if(file.size>1024*1024){setAudioStatus(fa?"حداکثر حجم هر فایل ۱ مگابایت است":"Each audio file is limited to 1 MB");return;}
    const reader=new FileReader();reader.onload=()=>{const asset:AudioAsset={id:uid(),name:file.name,dataUrl:String(reader.result),mode:"effect",volume:.8,loop:false};onScenePatch({audioAssets:[...assets,asset]});setAudioStatus(fa?"صدا در پروژه ذخیره شد":"Audio embedded in project");};reader.onerror=()=>setAudioStatus("Could not read audio file");reader.readAsDataURL(file);
  }
  function playAudio(asset:AudioAsset){if(audioRef.current){audioRef.current.pause();audioRef.current.src=asset.dataUrl;audioRef.current.volume=asset.volume;audioRef.current.loop=asset.loop;void audioRef.current.play().then(()=>setAudioStatus(fa?"در حال پخش":"Playing")).catch(()=>setAudioStatus(fa?"پخش توسط مرورگر مسدود شد":"Playback was blocked by the browser"));}}
  function addNode(){const isEvent=["start","collision","collect","goal"].includes(nodeKind);const node:LogicNode={id:uid(),kind:nodeKind,entityId:nodeEntity||(isEvent?undefined:selected?.id),value:nodeValue,audioId:nodeKind==="play-audio"?(nodeAudio||selectedAudio?.id):undefined};onScenePatch({logicNodes:[...nodes,node]});}
  function connect(){if(!from||!to||from===to||edges.some(e=>e.from===from&&e.to===to))return;onScenePatch({logicEdges:[...edges,{from,to}]});}
  function exportAndroidKit(){const appId=androidName.trim().toLowerCase();if(!/^[a-z][a-z0-9_]*(\\.[a-z][a-z0-9_]*)+$/.test(appId)){setExportMessage("Use a valid app ID such as com.example.game");return;}
    const kit={product:"VELTRIX AI Android package",app:{name:projectName,appId,version:"1.0.0"},webDir:"out",buildCommand:"npm run build && npx cap sync android && cd android && ./gradlew assembleDebug",projectFormat:".veltrix",note:"Build this project from the repository using the Android build workflow; this manifest itself is not an APK."};
    const url=URL.createObjectURL(new Blob([JSON.stringify(kit,null,2)],{type:"application/json"}));const a=document.createElement("a");a.href=url;a.download="veltrix-android-build.json";a.click();URL.revokeObjectURL(url);setExportMessage(fa?"راهنمای ساخت اندروید صادر شد":"Android build manifest exported");
  }

  return <section className="vx-advanced">
    <div className="vx-advanced-head"><div><strong>{fa?"سیستم‌های پیشرفته":"ADVANCED SYSTEMS"}</strong><small>{fa?"داده‌ها در فایل پروژه ذخیره می‌شوند":"Scene data is included in .veltrix exports"}</small></div></div>
    <nav className="vx-advanced-tabs">{([["physics",fa?"فیزیک":"Physics"],["animation",fa?"تایم‌لاین":"Timeline"],["audio",fa?"صدا":"Audio"],["visual",fa?"اسکریپت بصری":"Visual Script"],["android","Android"]] as const).map(([id,label])=><button key={id} className={tab===id?"active":""} onClick={()=>setTab(id)}>{label}</button>)}</nav>
    {tab==="physics"&&<div className="vx-tool-panel"><h4>{fa?"پارامترهای فیزیک بدنه":"Physics body properties"}</h4>{!selected?<p>{fa?"ابتدا یک شیء انتخاب کن.":"Select an entity first."}</p>:<>
      <p>{selected.name}</p>
      <label>{fa?"جرم":"Mass"}<input type="number" min=".1" max="1000" step=".1" value={selected.mass??1} onChange={e=>onPatch({mass:Math.max(.1,Math.min(1000,Number(e.target.value)||1))})}/></label>
      <label>{fa?"اصطکاک":"Friction"}<input type="range" min="0" max="1" step=".05" value={selected.friction??.2} onChange={e=>onPatch({friction:Number(e.target.value)})}/><span>{(selected.friction??.2).toFixed(2)}</span></label>
      <label>{fa?"جهندگی":"Restitution"}<input type="range" min="0" max="1" step=".05" value={selected.restitution??.1} onChange={e=>onPatch({restitution:Number(e.target.value)})}/><span>{(selected.restitution??.1).toFixed(2)}</span></label>
      <label>{fa?"مقیاس گرانش":"Gravity scale"}<input type="range" min="0" max="3" step=".1" value={selected.gravityScale??0} onChange={e=>onPatch({gravityScale:Number(e.target.value)})}/><span>{(selected.gravityScale??0).toFixed(1)}</span></label>
      <label>{fa?"نوع بدنه":"Body type"}<select value={selected.bodyType??(selected.kind==="platform"?"static":"dynamic")} onChange={e=>onPatch({bodyType:e.target.value as GameEntity["bodyType"]})}><option value="dynamic">Dynamic</option><option value="static">Static</option><option value="kinematic">Kinematic</option></select></label>
      <label className="vx-inline-check"><input type="checkbox" checked={!!selected.isSensor} onChange={e=>onPatch({isSensor:e.target.checked})}/>{fa?"حسگر بدون پاسخ فیزیکی":"Sensor / trigger"}</label>
    </>}</div>}
    {tab==="animation"&&<div className="vx-tool-panel"><h4>{fa?"انیمیشن فریم کلیدی":"Keyframe animation"}</h4>
      {!selected?<p>{fa?"یک شیء انتخاب کن.":"Select an entity."}</p>:<>
      <label>{fa?"نام ترک":"Track name"}<input value={track?.name??selected.name+" animation"} onChange={e=>{const current=track??{id:uid(),entityId:selected.id,name:e.target.value,duration,loop:false,keyframes:[]};patchTrack({...current,name:e.target.value});}}/></label>
      <label>{fa?"مدت (ثانیه)":"Duration (seconds)"}<input type="number" min=".1" max="600" step=".1" value={track?.duration??duration} onChange={e=>{const d=Math.max(.1,Math.min(600,Number(e.target.value)||3));setDuration(d);if(track)patchTrack({...track,duration:d,keyframes:track.keyframes.map(k=>({...k,time:Math.min(d,k.time)}))});}}/></label>
      <label className="vx-inline-check"><input type="checkbox" checked={track?.loop??false} onChange={e=>track&&patchTrack({...track,loop:e.target.checked})}/>{fa?"تکرار حلقه‌ای":"Loop"}</label>
      <label>{fa?"موقعیت پخش":"Playhead"}<input type="range" min="0" max={track?.duration??duration} step=".01" value={Math.min(playhead,track?.duration??duration)} onChange={e=>setPlayhead(Number(e.target.value))}/><span>{playhead.toFixed(2)}s</span></label>
      <div className="vx-audio-actions"><button onClick={addKeyframe}>{fa?"ثبت فریم از وضعیت فعلی":"Add keyframe at playhead"}</button><button onClick={()=>setPlaying(v=>!v)} disabled={!track||keys.length<2}>{playing?(fa?"توقف":"Stop"):(fa?"پخش":"Play")}</button><button onClick={()=>{setPlaying(false);setPlayhead(0);}}>{fa?"بازنشانی":"Reset"}</button></div>
      <div className="vx-timeline-ruler">{keys.map(k=><button key={k.id} title={k.time+"s"} onClick={()=>{setPlayhead(k.time);onPatch({x:k.x,y:k.y,width:k.width,height:k.height,rotation:k.rotation,opacity:k.opacity});}}>◆ {k.time.toFixed(2)}s</button>)}</div>
      {keys.map(k=><div className="vx-keyframe" key={k.id}><span>{k.time.toFixed(2)}s</span><label>{fa?"زمان":"Time"}<input type="number" min="0" max={track?.duration??duration} step=".01" value={k.time} onChange={e=>updateKey(k,{time:Math.max(0,Math.min(track?.duration??duration,Number(e.target.value)||0))})}/></label><select value={k.easing} onChange={e=>updateKey(k,{easing:e.target.value as AnimationKeyframe["easing"]})}><option value="linear">Linear</option><option value="ease-in">Ease in</option><option value="ease-out">Ease out</option><option value="ease-in-out">Ease in/out</option></select><button onClick={()=>removeKey(k.id)}>×</button></div>)}
      </>}</div>}
    {tab==="audio"&&<div className="vx-tool-panel"><h4>{fa?"کتابخانه صوتی پروژه":"Project audio library"}</h4><input type="file" accept="audio/*" onChange={e=>addAudio(e.target.files?.[0])}/><audio ref={audioRef} controls/><p className="vx-tool-hint">{fa?"فایل صوتی حداکثر ۱ مگابایت در پروژه جاسازی می‌شود.":"Audio files up to 1 MB are embedded in the project file."}</p>
      {assets.map(asset=><div className="vx-keyframe" key={asset.id}><strong>{asset.name}</strong><select value={asset.mode} onChange={e=>onScenePatch({audioAssets:assets.map(a=>a.id===asset.id?{...a,mode:e.target.value as AudioAsset["mode"],loop:e.target.value==="music"}:a)})}><option value="effect">Effect</option><option value="music">Music</option></select><label>{fa?"بلندی":"Volume"}<input type="range" min="0" max="1" step=".05" value={asset.volume} onChange={e=>onScenePatch({audioAssets:assets.map(a=>a.id===asset.id?{...a,volume:Number(e.target.value)}:a)})}/></label><button onClick={()=>playAudio(asset)}>{fa?"پخش":"Play"}</button><button onClick={()=>onScenePatch({audioAssets:assets.filter(a=>a.id!==asset.id)})}>×</button></div>)}
      {audioStatus&&<p role="status">{audioStatus}</p>}</div>}
    {tab==="visual"&&<div className="vx-tool-panel"><h4>{fa?"گراف منطق اجرایی":"Executable visual logic graph"}</h4>
      <p className="vx-tool-hint">{fa?"گره‌ها و یال‌ها در صحنه ذخیره می‌شوند؛ گره‌های رویداد و اکشن برای اتصال به runtime تعریف شده‌اند.":"Nodes and edges are saved with this scene; event/action nodes are designed for runtime dispatch."}</p>
      <div className="vx-audio-actions"><select value={nodeKind} onChange={e=>setNodeKind(e.target.value as LogicNode["kind"])}>{nodeKinds.map(k=><option key={k} value={k}>{k}</option>)}</select><select value={nodeEntity} onChange={e=>setNodeEntity(e.target.value)}><option value="">Selected entity</option>{scene.entities.map(e=><option key={e.id} value={e.id}>{e.name}</option>)}</select><input type="number" value={nodeValue} onChange={e=>setNodeValue(Number(e.target.value))}/><button onClick={addNode}>{fa?"افزودن گره":"Add node"}</button></div>
      {nodes.map(n=><div className="vx-node" key={n.id}><strong>{n.kind}</strong><span>{scene.entities.find(e=>e.id===n.entityId)?.name??"—"} · {n.value??""}</span><button onClick={()=>onScenePatch({logicNodes:nodes.filter(x=>x.id!==n.id),logicEdges:edges.filter(e=>e.from!==n.id&&e.to!==n.id)})}>×</button></div>)}
      <div className="vx-connect"><select value={from} onChange={e=>setFrom(e.target.value)}><option value="">From…</option>{nodes.map(n=><option key={n.id} value={n.id}>{n.kind}</option>)}</select><span>→</span><select value={to} onChange={e=>setTo(e.target.value)}><option value="">To…</option>{nodes.map(n=><option key={n.id} value={n.id}>{n.kind}</option>)}</select><button onClick={connect}>{fa?"اتصال":"Connect"}</button></div>
      {edges.map((e,i)=><p key={i}>{nodes.find(n=>n.id===e.from)?.kind} → {nodes.find(n=>n.id===e.to)?.kind}<button onClick={()=>onScenePatch({logicEdges:edges.filter((_,j)=>j!==i)})}>×</button></p>)}
    </div>}
    {tab==="android"&&<div className="vx-tool-panel"><h4>{fa?"ساخت بسته اندروید":"Android packaging"}</h4><label>{fa?"شناسه برنامه":"Application ID"}<input value={androidName} onChange={e=>setAndroidName(e.target.value)}/></label><button onClick={exportAndroidKit}>{fa?"خروجی راهنمای ساخت":"Export Android build manifest"}</button><p className="vx-tool-hint">{fa?"این فایل APK نیست؛ ساخت APK به build وب، Capacitor، Android SDK و Gradle نیاز دارد.":"This is a build manifest, not an APK. Android SDK and Gradle are required for compilation."}</p>{exportMessage&&<p role="status">{exportMessage}</p>}</div>}
  </section>;
}
