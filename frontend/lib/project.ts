export type EntityKind = "player" | "enemy" | "collectible" | "platform" | "decoration" | "hazard" | "goal" | "npc";
export type EntityBehavior = "static" | "patrol" | "float" | "chase";
export type GameEntity = {
  id: string;
  name: string;
  kind: EntityKind;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  visible: boolean;
  behavior?: EntityBehavior;
  speed?: number;
  rotation?: number;
  opacity?: number;
  bodyType?: "dynamic" | "static" | "kinematic";
  mass?: number;
  friction?: number;
  restitution?: number;
  gravityScale?: number;
  isSensor?: boolean;
};
export type GameScene = {
  id: string;
  name: string;
  width: number;
  height: number;
  background: string;
  entities: GameEntity[];
};
export type GameProject = {
  schemaVersion: 1;
  id: string;
  name: string;
  description: string;
  language: "fa" | "en";
  createdAt: string;
  updatedAt: string;
  activeSceneId: string;
  scenes: GameScene[];
};
export type NewDesign = {
  title?: string;
  description?: string;
  theme?: string;
  template?: string;
};

const palettes: Record<string, string> = {
  space: "#142b50", "فضایی": "#142b50",
  forest: "#244d3c", "جنگلی": "#244d3c",
  cyber: "#251342", "سایبر": "#251342",
  fantasy: "#49315e", "فانتزی": "#49315e"
};
const makeId = () => typeof crypto !== "undefined" && "randomUUID" in crypto
  ? crypto.randomUUID()
  : "vx-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 9);

export function createProject(design: NewDesign = {}): GameProject {
  const now = new Date().toISOString();
  const theme = (design.theme || "fantasy").toLocaleLowerCase();
  const background = Object.entries(palettes).find(([key]) => theme.includes(key))?.[1] || "#18243b";
  const sceneId = makeId();
  const isDodge = design.template === "dodge";
  return {
    schemaVersion: 1,
    id: makeId(),
    name: (design.title || "Untitled Game").slice(0, 80),
    description: (design.description || "A new game project").slice(0, 500),
    language: /[\u0600-\u06ff]/.test((design.title || "") + (design.description || "")) ? "fa" : "en",
    createdAt: now,
    updatedAt: now,
    activeSceneId: sceneId,
    scenes: [{
      id: sceneId, name: "Main Scene", width: 960, height: 540, background,
      entities: [
        { id: makeId(), name: "Player", kind: "player", x: 150, y: 390, width: 42, height: 52, color: "#56d8ee", visible: true, behavior: "static", speed: 180, rotation: 0, opacity: 1 },
        ...(isDodge
          ? [{ id: makeId(), name: "Meteor", kind: "enemy" as const, x: 620, y: 170, width: 46, height: 46, color: "#e47779", visible: true, behavior: "patrol" as const, speed: 90, rotation: 0, opacity: 1 }]
          : [{ id: makeId(), name: "Crystal", kind: "collectible" as const, x: 420, y: 240, width: 28, height: 28, color: "#ffc857", visible: true, behavior: "float" as const, speed: 30, rotation: 0, opacity: 1 }]),
        { id: makeId(), name: "Exit Portal", kind: "goal", x: 850, y: 420, width: 48, height: 64, color: "#53e0a2", visible: true, behavior: "static", speed: 0, rotation: 0, opacity: 1 }
      ]
    }]
  };
}

export function validateProject(value: unknown): value is GameProject {
  if (!value || typeof value !== "object") return false;
  const p = value as Partial<GameProject>;
  if (p.schemaVersion !== 1 || typeof p.id !== "string" || typeof p.name !== "string" || p.name.length < 1 || p.name.length > 80 ||
      typeof p.description !== "string" || p.description.length > 500 || !["fa", "en"].includes(p.language || "") ||
      !Array.isArray(p.scenes) || p.scenes.length < 1 || p.scenes.length > 100) return false;
  if (!p.scenes.every(scene => scene && typeof scene.id === "string" &&
      typeof scene.name === "string" && scene.name.length <= 80 && Number.isFinite(scene.width) && Number.isFinite(scene.height) &&
      scene.width >= 160 && scene.width <= 4096 && scene.height >= 120 && scene.height <= 4096 &&
      /^#[0-9a-fA-F]{6}$/.test(scene.background) && Array.isArray(scene.entities) && scene.entities.length <= 1000 &&
      scene.entities.every(entity => entity && typeof entity.id === "string" &&
        typeof entity.name === "string" && entity.name.length <= 80 &&
        ["player", "enemy", "collectible", "platform", "decoration", "hazard", "goal", "npc"].includes(entity.kind) &&
        [entity.x, entity.y, entity.width, entity.height].every(Number.isFinite) &&
        entity.x >= 0 && entity.y >= 0 && entity.width > 0 && entity.height > 0 &&
        entity.x + entity.width <= scene.width && entity.y + entity.height <= scene.height && /^#[0-9a-fA-F]{6}$/.test(entity.color) &&
        typeof entity.visible === "boolean" &&
        (entity.behavior === undefined || ["static", "patrol", "float", "chase"].includes(entity.behavior)) &&
        (entity.speed === undefined || (Number.isFinite(entity.speed) && entity.speed >= 0 && entity.speed <= 1000)) &&
        (entity.rotation === undefined || Number.isFinite(entity.rotation)) &&
        (entity.opacity === undefined || (Number.isFinite(entity.opacity) && entity.opacity >= 0 && entity.opacity <= 1)) &&
        (entity.bodyType === undefined || ["dynamic", "static", "kinematic"].includes(entity.bodyType)) &&
        (entity.mass === undefined || (Number.isFinite(entity.mass) && entity.mass >= 0.1 && entity.mass <= 1000)) &&
        (entity.friction === undefined || (Number.isFinite(entity.friction) && entity.friction >= 0 && entity.friction <= 1)) &&
        (entity.restitution === undefined || (Number.isFinite(entity.restitution) && entity.restitution >= 0 && entity.restitution <= 1)) &&
        (entity.gravityScale === undefined || (Number.isFinite(entity.gravityScale) && entity.gravityScale >= 0 && entity.gravityScale <= 3)) &&
        (entity.isSensor === undefined || typeof entity.isSensor === "boolean"))) return false;
  return p.scenes.some(scene => scene.id === p.activeSceneId);
}

export function createEntity(kind: EntityKind, index: number): GameEntity {
  const colors: Record<EntityKind, string> = {
    player: "#56d8ee", enemy: "#e47779", collectible: "#ffc857",
    platform: "#6485b7", decoration: "#a78bfa", hazard: "#ff5b67", goal: "#53e0a2", npc: "#f0a6ff"
  };
  const sizes: Record<EntityKind, [number, number]> = {
    player: [42, 52], enemy: [46, 46], collectible: [28, 28],
    platform: [180, 24], decoration: [36, 36], hazard: [42, 42], goal: [48, 64], npc: [42, 52]
  };
  const [width, height] = sizes[kind];
  return { id: makeId(), name: kind[0].toUpperCase() + kind.slice(1) + " " + (index + 1),
    kind, x: 120 + (index % 5) * 90, y: 140 + (index % 3) * 70,
    width, height, color: colors[kind], visible: true, behavior: kind === "enemy" ? "patrol" : kind === "decoration" ? "float" : "static", speed: kind === "enemy" ? 90 : 30, rotation: 0, opacity: 1 };
}
