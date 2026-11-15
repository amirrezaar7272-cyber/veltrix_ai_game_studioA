"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createEntity, createProject, type EntityKind, type GameEntity, type GameProject, type GameScene, type NewDesign } from "../lib/project";
import { deleteProject, exportProject, importProject, loadProjects, saveProject } from "../lib/projectStore";

const labels = {
  en: { studio: "PROJECT WORKSPACE", projects: "Projects", new: "New project", save: "Save project", export: "Export .veltrix", import: "Import project", scene: "Scene", addScene: "Add scene", objects: "Objects", addObject: "Add object", inspector: "Inspector", name: "Project name", sceneName: "Scene name", background: "Background", width: "Width", height: "Height", delete: "Delete", saved: "Saved on this device", empty: "No saved projects yet", select: "Select an object to edit its properties", visible: "Visible", kind: "Type", x: "Position X", y: "Position Y", w: "Width", h: "Height", color: "Color", language: "فارسی" },
  fa: { studio: "فضای کار پروژه", projects: "پروژه‌ها", new: "پروژه جدید", save: "ذخیره پروژه", export: "خروجی .veltrix", import: "ورود پروژه", scene: "صحنه", addScene: "افزودن صحنه", objects: "اشیا", addObject: "افزودن شیء", inspector: "بازرس", name: "نام پروژه", sceneName: "نام صحنه", background: "پس‌زمینه", width: "عرض", height: "ارتفاع", delete: "حذف", saved: "روی همین دستگاه ذخیره می‌شود", empty: "هنوز پروژه‌ای ذخیره نشده", select: "برای ویرایش ویژگی‌ها یک شیء انتخاب کن", visible: "نمایش", kind: "نوع", x: "موقعیت افقی", y: "موقعیت عمودی", w: "عرض", h: "ارتفاع", color: "رنگ", language: "English" }
};
const kinds: EntityKind[] = ["player", "enemy", "collectible", "platform", "decoration"];

export default function StudioWorkspace({ initialDesign }: { initialDesign?: NewDesign }) {
  const [project, setProject] = useState<GameProject>(() => createProject());
  const [projects, setProjects] = useState<GameProject[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [language, setLanguage] = useState<"fa" | "en">("en");
  const [message, setMessage] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);
  const t = labels[language];
  const scene = useMemo(() => project.scenes.find(item => item.id === project.activeSceneId) || project.scenes[0], [project]);
  const selected = scene?.entities.find(item => item.id === selectedId);

  useEffect(() => { setProjects(loadProjects()); }, []);
  useEffect(() => {
    if (!initialDesign) return;
    const next = createProject(initialDesign);
    setProject(next);
    setSelectedId(next.scenes[0].entities[0]?.id || "");
    setMessage("A new editable project was created from your game design.");
  }, [initialDesign?.title, initialDesign?.description, initialDesign?.theme, initialDesign?.template]);

  function updateScene(patch: Partial<GameScene>) {
    setProject(current => ({ ...current, updatedAt: new Date().toISOString(),
      scenes: current.scenes.map(item => item.id === current.activeSceneId ? { ...item, ...patch } : item) }));
  }
  function updateEntity(patch: Partial<GameEntity>) {
    if (!selected) return;
    updateScene({ entities: scene.entities.map(item => item.id === selected.id ? { ...item, ...patch } : item) });
  }
  function save() {
    try { const next = saveProject(project); setProjects(next); setMessage(t.saved); }
    catch (error) { setMessage(error instanceof Error ? error.message : "Could not save project."); }
  }
  function createNew() {
    const next = createProject();
    setProject(next); setSelectedId(next.scenes[0].entities[0].id); setMessage("");
  }
  function addScene() {
    const next: GameScene = { id: "scene-" + Date.now().toString(36), name: "Scene " + (project.scenes.length + 1), width: 960, height: 540, background: "#18243b", entities: [] };
    setProject(current => ({ ...current, activeSceneId: next.id, scenes: [...current.scenes, next] }));
    setSelectedId("");
  }
  function addObject(kind: EntityKind) {
    const entity = createEntity(kind, scene.entities.length);
    updateScene({ entities: [...scene.entities, entity] });
    setSelectedId(entity.id);
  }
  function chooseProject(item: GameProject) {
    setProject(item); setSelectedId(item.scenes.find(s => s.id === item.activeSceneId)?.entities[0]?.id || "");
  }
  function download() {
    const blob = new Blob([exportProject(project)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url; anchor.download = project.name.toLowerCase().replace(/[^a-z0-9\u0600-\u06ff]+/gi, "-") + ".veltrix";
    anchor.click(); URL.revokeObjectURL(url);
  }
  async function readImport(file?: File) {
    if (!file) return;
    try {
      const imported = importProject(await file.text());
      setProject(imported); setSelectedId(imported.scenes[0]?.entities[0]?.id || "");
      setMessage("Project imported. Save it to keep it in this device's project list.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Import failed."); }
    if (fileInput.current) fileInput.current.value = "";
  }
  function removeCurrent() {
    const next = deleteProject(project.id);
    setProjects(next);
    createNew();
  }

  return <section className="studio-workspace" dir={language === "fa" ? "rtl" : "ltr"}>
    <div className="studio-heading">
      <div><p className="eyebrow">{t.studio}</p><h2>VELTRIX <span>STUDIO</span></h2><p>{t.saved} · Browser storage only</p></div>
      <button className="studio-quiet" onClick={() => setLanguage(v => v === "en" ? "fa" : "en")}>{t.language}</button>
    </div>
    <div className="studio-toolbar">
      <button onClick={createNew}>{t.new}</button><button onClick={save}>{t.save}</button>
      <button className="studio-quiet" onClick={download}>{t.export}</button>
      <button className="studio-quiet" onClick={() => fileInput.current?.click()}>{t.import}</button>
      <input ref={fileInput} type="file" accept=".veltrix,.json,application/json" hidden onChange={e => void readImport(e.target.files?.[0])} />
    </div>
    {message && <p className="studio-message" role="status">{message}</p>}
    <div className="studio-layout">
      <aside className="studio-sidebar">
        <h3>{t.projects}</h3>
        {projects.length === 0 && <p className="studio-muted">{t.empty}</p>}
        {projects.map(item => <button key={item.id} className={"studio-project-item " + (item.id === project.id ? "active" : "")} onClick={() => chooseProject(item)}>{item.name}<small>{item.scenes.length} {t.scene.toLowerCase()}(s)</small></button>)}
        <h3>{t.objects}</h3>
        <div className="studio-object-list">
          {scene.entities.map(entity => <button key={entity.id} className={"studio-object-item " + (entity.id === selectedId ? "active" : "")} onClick={() => setSelectedId(entity.id)}><span>{entity.name}</span><small>{entity.kind}</small></button>)}
        </div>
        <label className="studio-field">{t.addObject}<select value="" onChange={e => { if (e.target.value) addObject(e.target.value as EntityKind); }}><option value="">＋ Choose type</option>{kinds.map(kind => <option key={kind} value={kind}>{kind}</option>)}</select></label>
      </aside>
      <div className="studio-main">
        <label className="studio-field">{t.name}<input value={project.name} maxLength={80} onChange={e => setProject(p => ({ ...p, name: e.target.value }))} /></label>
        <div className="studio-scene-tabs">{project.scenes.map(item => <button key={item.id} className={item.id === scene.id ? "active" : "studio-quiet"} onClick={() => { setProject(p => ({ ...p, activeSceneId: item.id })); setSelectedId(""); }}>{item.name}</button>)}<button className="studio-quiet" onClick={addScene}>＋ {t.addScene}</button></div>
        <div className="studio-canvas" style={{ aspectRatio: scene.width + " / " + scene.height, background: scene.background }}>
          <div className="studio-canvas-grid" />
          {scene.entities.filter(entity => entity.visible).map(entity => <button key={entity.id} aria-label={entity.name} onClick={() => setSelectedId(entity.id)} className={"studio-canvas-entity " + (entity.id === selectedId ? "selected" : "")} style={{ left: (entity.x / scene.width * 100) + "%", top: (entity.y / scene.height * 100) + "%", width: (entity.width / scene.width * 100) + "%", height: (entity.height / scene.height * 100) + "%", background: entity.color, borderRadius: entity.kind === "collectible" || entity.kind === "enemy" ? "50%" : "7px" }}><span>{entity.name}</span></button>)}
          {scene.entities.length === 0 && <p className="studio-canvas-empty">Add objects to begin building this scene</p>}
        </div>
        <div className="studio-scene-settings">
          <label className="studio-field">{t.sceneName}<input value={scene.name} onChange={e => updateScene({ name: e.target.value })} /></label>
          <label className="studio-field">{t.background}<input type="color" value={scene.background} onChange={e => updateScene({ background: e.target.value })} /></label>
          <label className="studio-field">{t.width}<input type="number" min="160" max="4096" value={scene.width} onChange={e => updateScene({ width: Math.max(160, Math.min(4096, Number(e.target.value) || 160)) })} /></label>
          <label className="studio-field">{t.height}<input type="number" min="120" max="4096" value={scene.height} onChange={e => updateScene({ height: Math.max(120, Math.min(4096, Number(e.target.value) || 120)) })} /></label>
        </div>
      </div>
      <aside className="studio-inspector">
        <h3>{t.inspector}</h3>
        {!selected && <p className="studio-muted">{t.select}</p>}
        {selected && <>
          <label className="studio-field">{t.name}<input value={selected.name} onChange={e => updateEntity({ name: e.target.value })} /></label>
          <label className="studio-field">{t.kind}<input value={selected.kind} readOnly /></label>
          {([[t.x, "x"], [t.y, "y"], [t.w, "width"], [t.h, "height"]] as const).map(([label, key]) => <label className="studio-field" key={key}>{label}<input type="number" min="1" max="4096" value={selected[key]} onChange={e => updateEntity({ [key]: Math.max(1, Math.min(4096, Number(e.target.value) || 1)) })} /></label>)}
          <label className="studio-field">{t.color}<input type="color" value={selected.color} onChange={e => updateEntity({ color: e.target.value })} /></label>
          <label className="studio-check"><input type="checkbox" checked={selected.visible} onChange={e => updateEntity({ visible: e.target.checked })} />{t.visible}</label>
          <button className="studio-danger" onClick={() => { updateScene({ entities: scene.entities.filter(item => item.id !== selected.id) }); setSelectedId(""); }}>{t.delete}</button>
        </>}
        <button className="studio-danger studio-delete-project" onClick={removeCurrent}>Delete saved project</button>
      </aside>
    </div>
    <p className="studio-footnote">Project data stays in this browser until you export it. Scene editing is an early editor foundation; playable export and APK packaging are not implemented yet.</p>
  </section>;
}
