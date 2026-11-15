import { validateProject, type GameProject } from "./project";

const STORAGE_KEY = "veltrix.studio.projects.v1";
const MAX_PROJECTS = 30;

export function loadProjects(): GameProject[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(validateProject).slice(0, MAX_PROJECTS);
  } catch { return []; }
}

export function saveProject(project: GameProject): GameProject[] {
  if (typeof window === "undefined") return [];
  const current = loadProjects();
  const nextProject = { ...project, updatedAt: new Date().toISOString() };
  const next = [nextProject, ...current.filter(item => item.id !== project.id)].slice(0, MAX_PROJECTS);
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); }
  catch { throw new Error("Storage is full or unavailable. Export a backup and remove older projects."); }
  return next;
}

export function deleteProject(id: string): GameProject[] {
  const next = loadProjects().filter(project => project.id !== id);
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); }
  catch { /* Keep the in-memory result usable. */ }
  return next;
}

export function exportProject(project: GameProject): string {
  return JSON.stringify(project, null, 2);
}

export function importProject(text: string): GameProject {
  const parsed: unknown = JSON.parse(text);
  if (!validateProject(parsed)) throw new Error("This file is not a valid VELTRIX project or uses an unsupported schema version.");
  return parsed;
}
