"use client";

import { useEffect, useRef, useState } from "react";
import type { GameEntity, GameScene } from "../lib/project";
import { PhysicsWorld } from "../lib/physicsWorld";
import { sampleAnimation } from "../lib/animation";
import { executeLogicGraph } from "../lib/visualScript";
import { drawGameEntity, drawSceneBackground } from "../lib/renderer2d";
import { ParticleSystem } from "../lib/particles";

type Props = { scene: GameScene; active: boolean; language?: "fa" | "en"; onComplete?: () => void };
type Input = { up: boolean; down: boolean; left: boolean; right: boolean; interact: boolean };

export default function GameRunner({ scene, active, language = "en", onComplete }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const input = useRef<Input>({ up: false, down: false, left: false, right: false, interact: false });
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [isDriving, setIsDriving] = useState(false);
  const [status, setStatus] = useState<"playing" | "won" | "lost" | "missing-player">("playing");
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    if (!active || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");
    if (!context) return;
    const ctx = context;
    const width = scene.width, height = scene.height;
    canvas.width = width; canvas.height = height;
    const entities = scene.entities.map(entity => ({ ...entity }));
    const player = entities.find(entity => entity.kind === "player");
    if (!player) { setStatus("missing-player"); return; }

    const collected = new Set<string>();
    const particles = new ParticleSystem();
    let points = 0, health = 3;
    const runtimeScene = { ...scene, entities };
    const audioPlayers = new Map<string, HTMLAudioElement>();
    const playAudio = (id: string) => {
      const asset = scene.audioAssets?.find(item => item.id === id);
      if (!asset) return;
      let audio = audioPlayers.get(id);
      if (!audio) { audio = new Audio(asset.dataUrl); audioPlayers.set(id, audio); }
      audio.volume = asset.volume; audio.loop = asset.loop;
      audio.currentTime = 0; void audio.play().catch(() => undefined);
    };
    const physics = new PhysicsWorld({ worldWidth: width, worldHeight: height, gravity: 980, maxSubstep: 1 / 120 });
    physics.sync(entities);
    let x = player.x, y = player.y, jumpWasDown = false;
    let last = 0, elapsed = 0, invulnerableUntil = 0, stopped = false, frame = 0, interactWasDown = false;
    let drivingVehicleId: string | null = null;
    let finalStatus: "won" | "lost" | null = null;
    setScore(0); setLives(3); setStatus("playing");
    void executeLogicGraph(runtimeScene, "start", player.id, { playAudio, addScore: value => { points += value; setScore(points); } });
    const sensorContacts = new Set<string>();
    const keys: Record<string, keyof Input> = {
      ArrowUp: "up", w: "up", W: "up", ArrowDown: "down", s: "down", S: "down",
      ArrowLeft: "left", a: "left", A: "left", ArrowRight: "right", d: "right", D: "right", e: "interact", E: "interact"
    };
    const down = (event: KeyboardEvent) => {
      const key = keys[event.key];
      if (key) { event.preventDefault(); input.current[key] = true; }
    };
    const up = (event: KeyboardEvent) => {
      const key = keys[event.key];
      if (key) { event.preventDefault(); input.current[key] = false; }
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    const hit = (ax: number, ay: number, aw: number, ah: number, bx: number, by: number, bw: number, bh: number) =>
      ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;

    const position = (entity: GameEntity) => {
      const track = scene.animationTracks?.find(item => item.entityId === entity.id);
      const pose = track ? sampleAnimation(track, elapsed) : undefined;
      if (pose) return { x: pose.x, y: pose.y };
      const speed = (entity.speed ?? 60) / 60;
      if (entity.behavior === "chase") {
        return { x: entity.x + Math.max(-90, Math.min(90, (x - entity.x) * .35)), y: entity.y + Math.max(-70, Math.min(70, (y - entity.y) * .25)) };
      }
      if (entity.behavior === "float") {
        return { x: entity.x + Math.sin(elapsed * speed + entity.x * .01) * 48, y: entity.y + Math.cos(elapsed * speed + entity.y * .01) * 28 };
      }
      if (entity.behavior === "patrol") return { x: entity.x + Math.sin(elapsed * speed + entity.x * .01) * 55, y: entity.y };
      return { x: entity.x, y: entity.y };
    };

    const draw = (time: number) => {
      if (stopped) return;
      const delta = Math.min((time - (last || time)) / 1000, .04);
      last = time; elapsed += delta;
      const jumpPressed = input.current.up && !jumpWasDown;
      jumpWasDown = input.current.up;
      const interactPressed = input.current.interact && !interactWasDown;
      interactWasDown = input.current.interact;
      if (interactPressed) {
        if (drivingVehicleId) {
          const currentVehicle = entities.find(item => item.id === drivingVehicleId);
          if (currentVehicle) { x = currentVehicle.x + currentVehicle.width + 6; y = currentVehicle.y; physics.bodies.get(player.id)!.x=x; physics.bodies.get(player.id)!.y=y; }
          drivingVehicleId = null; setIsDriving(false);
        } else {
          const nearest = entities.filter(item => item.kind === "vehicle" && item.visible)
            .map(item => ({ item, distance: Math.hypot((item.x + item.width/2) - (x + player.width/2), (item.y + item.height/2) - (y + player.height/2)) }))
            .sort((a,b) => a.distance-b.distance)[0];
          if (nearest && nearest.distance < 105) { drivingVehicleId = nearest.item.id; setIsDriving(true); }
        }
      }
      const contacts = physics.step(entities, delta, { up: input.current.up, down: input.current.down, left: input.current.left, right: input.current.right, jumpPressed }, player.id);
      const currentSensors = new Set<string>();
      for (const contact of contacts.filter(item => item.sensor)) {
        const otherId = contact.a === player.id ? contact.b : contact.a;
        currentSensors.add(otherId);
        if (!sensorContacts.has(otherId)) void executeLogicGraph(runtimeScene, "collision", otherId, { playAudio, addScore: value => { points += value; setScore(points); } });
      }
      sensorContacts.clear(); currentSensors.forEach(id => sensorContacts.add(id));
      const playerBody = physics.bodies.get(player.id)!;
      x = playerBody.x; y = playerBody.y;
      const drivingVehicle = drivingVehicleId ? entities.find(item => item.id === drivingVehicleId) : undefined;
      if (drivingVehicle) {
        const dx = (input.current.right?1:0)-(input.current.left?1:0);
        const dy = (input.current.down?1:0)-(input.current.up?1:0);
        const length = Math.hypot(dx,dy) || 1;
        const stepX = dx/length*(drivingVehicle.speed??190)*delta;
        const stepY = dy/length*(drivingVehicle.speed??190)*delta;
        const blocked = (nx:number,ny:number) => entities.some(item => item.kind==="building" && item.visible &&
          nx < item.x+item.width && nx+drivingVehicle.width > item.x && ny < item.y+item.height && ny+drivingVehicle.height > item.y);
        const nextX=Math.max(0,Math.min(width-drivingVehicle.width,drivingVehicle.x+stepX));
        const nextY=Math.max(0,Math.min(height-drivingVehicle.height,drivingVehicle.y+stepY));
        if (!blocked(nextX,drivingVehicle.y)) drivingVehicle.x=nextX;
        if (!blocked(drivingVehicle.x,nextY)) drivingVehicle.y=nextY;
        x=drivingVehicle.x+drivingVehicle.width/2-player.width/2;
        y=drivingVehicle.y+drivingVehicle.height/2-player.height/2;
        playerBody.x=x;playerBody.y=y;playerBody.vx=0;playerBody.vy=0;
      }
      for (const item of entities.filter(item => item.visible && item.kind === "collectible" && !collected.has(item.id))) {
        const p = position(item);
        if (hit(x, y, player.width, player.height, p.x, p.y, item.width, item.height)) {
          collected.add(item.id); points += 10; setScore(points);
          particles.emit(p.x + item.width / 2, p.y + item.height / 2, 24, item.color, 190);
          executeLogicGraph(runtimeScene, "collect", item.id, { playAudio, addScore: value => { points += value; setScore(points); } });
        }
      }
      for (const goal of entities.filter(item => item.visible && item.kind === "goal")) {
        if (hit(x, y, player.width, player.height, goal.x, goal.y, goal.width, goal.height)) {
          stopped = true; finalStatus = "won"; setStatus("won");
          void executeLogicGraph(runtimeScene, "goal", goal.id, { playAudio, addScore: value => { points += value; setScore(points); } }).finally(() => onCompleteRef.current?.());
        }
      }
      for (const danger of entities.filter(item => !stopped && item.visible && (item.kind === "enemy" || item.kind === "hazard"))) {
        const p = position(danger);
        if (elapsed >= invulnerableUntil && hit(x, y, player.width, player.height, p.x, p.y, danger.width, danger.height)) {
          health -= 1; setLives(health); invulnerableUntil = elapsed + 1.1; x = player.x; y = player.y;
          particles.emit(x + player.width / 2, y + player.height / 2, 32, "#ff657a", 230);
          executeLogicGraph(runtimeScene, "collision", danger.id, { playAudio, addScore: value => { points += value; setScore(points); } });
          if (health <= 0) { stopped = true; finalStatus = "lost"; setStatus("lost"); }
        }
      }

      particles.update(delta);
      ctx.clearRect(0, 0, width, height);
      drawSceneBackground(ctx, scene, elapsed);
      for (const entity of entities) {
        if (!entity.visible || entity.kind === "player" || (entity.kind === "collectible" && collected.has(entity.id))) continue;
        const p = position(entity);
        const track = scene.animationTracks?.find(item => item.entityId === entity.id);
        const pose = track ? sampleAnimation(track, elapsed) : undefined;
        drawGameEntity(ctx, entity, p.x, p.y, elapsed, pose ?? {});
      }
      if (!drivingVehicle) drawGameEntity(ctx, player, x, y, elapsed);
      particles.draw(ctx);

      if (stopped) {
        ctx.fillStyle = "#07111edc"; ctx.fillRect(0, 0, width, height);
        ctx.fillStyle = "#ffffff"; ctx.textAlign = "center"; ctx.font = "bold 30px Arial";
        ctx.fillText(finalStatus === "won" ? "LEVEL COMPLETE" : "GAME OVER", width / 2, height / 2);
        ctx.font = "16px Arial"; ctx.fillText("Score: " + points, width / 2, height / 2 + 32);
        return;
      }
      frame = requestAnimationFrame(draw);
    };
    frame = requestAnimationFrame(draw);
    return () => {
      stopped = true; cancelAnimationFrame(frame);
      audioPlayers.forEach(audio => { audio.pause(); audio.src = ""; });
      audioPlayers.clear();
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      input.current = { up: false, down: false, left: false, right: false, interact: false };
    };
  }, [scene, active]);

  function press(key: keyof Input, value: boolean) { input.current[key] = value; }
  return <div className="studio-runner">
    <div className="studio-runner-bar"><strong>{language === "fa" ? "اجرای زنده صحنه" : "LIVE SCENE"}</strong><span>{language === "fa" ? "امتیاز" : "Score"}: {score}</span><span>{language === "fa" ? "جان" : "Lives"}: {lives}</span>
      {isDriving && <span>{language === "fa" ? "در حال رانندگی" : "DRIVING"}</span>}
      {status === "won" && <span>{language === "fa" ? "مرحله کامل شد" : "Level complete"}</span>}
      {status === "lost" && <span>{language === "fa" ? "بازی تمام شد" : "Game over"}</span>}
      {status === "missing-player" && <span>{language === "fa" ? "برای اجرای صحنه یک شخصیت بازیکن اضافه کن" : "Add a player object to run this scene"}</span>}
    </div>
    <canvas ref={canvasRef} className="studio-runner-canvas" />
    <div className="studio-runner-controls">
      <span />
      <button aria-label={language === "fa" ? "حرکت بالا" : "Move up"} onPointerDown={() => press("up", true)} onPointerUp={() => press("up", false)} onPointerLeave={() => press("up", false)} onPointerCancel={() => press("up", false)}>▲</button>
      <span />
      <button aria-label={language === "fa" ? "حرکت چپ" : "Move left"} onPointerDown={() => press("left", true)} onPointerUp={() => press("left", false)} onPointerLeave={() => press("left", false)} onPointerCancel={() => press("left", false)}>◀</button>
      <button aria-label={language === "fa" ? "حرکت پایین" : "Move down"} onPointerDown={() => press("down", true)} onPointerUp={() => press("down", false)} onPointerLeave={() => press("down", false)} onPointerCancel={() => press("down", false)}>▼</button>
      <button aria-label={language === "fa" ? "حرکت راست" : "Move right"} onPointerDown={() => press("right", true)} onPointerUp={() => press("right", false)} onPointerLeave={() => press("right", false)} onPointerCancel={() => press("right", false)}>▶</button>
      <button aria-label={language === "fa" ? "سوار یا پیاده شدن" : "Enter or exit vehicle"} onPointerDown={() => press("interact", true)} onPointerUp={() => press("interact", false)} onPointerLeave={() => press("interact", false)} onPointerCancel={() => press("interact", false)}>E</button>
    </div>
    <p className="studio-muted">{language === "fa" ? "کنترل: جهت‌ها یا WASD · کلید E برای سوار/پیاده‌شدن از خودرو · موبایل: دکمه E · در شهر بگرد و مأموریت‌ها را انجام بده." : "Keyboard: arrows / WASD · E to enter/exit nearby vehicles · Touch: directional pad + E · Explore, collect tokens and reach the mission marker."}</p>
  </div>;
}
