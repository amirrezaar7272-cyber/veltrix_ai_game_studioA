"use client";

import { useEffect, useRef, useState } from "react";
import type { GameEntity, GameScene } from "../lib/project";

type Props = { scene: GameScene; active: boolean; language?: "fa" | "en"; onComplete?: () => void };
type Input = { up: boolean; down: boolean; left: boolean; right: boolean };

export default function GameRunner({ scene, active, language = "en", onComplete }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const input = useRef<Input>({ up: false, down: false, left: false, right: false });
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
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
    let x = player.x, y = player.y, points = 0, health = 3, verticalVelocity = 0, grounded = false;
    let last = 0, elapsed = 0, invulnerableUntil = 0, stopped = false, frame = 0;
    let finalStatus: "won" | "lost" | null = null;
    setScore(0); setLives(3); setStatus("playing");
    const keys: Record<string, keyof Input> = {
      ArrowUp: "up", w: "up", W: "up", ArrowDown: "down", s: "down", S: "down",
      ArrowLeft: "left", a: "left", A: "left", ArrowRight: "right", d: "right", D: "right"
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

    const drawEntity = (entity: GameEntity) => {
      const p = position(entity);
      ctx.save();
      ctx.globalAlpha = entity.opacity ?? 1;
      ctx.translate(p.x + entity.width / 2, p.y + entity.height / 2);
      ctx.rotate((entity.rotation ?? 0) * Math.PI / 180);
      ctx.fillStyle = entity.color;
      if (["collectible", "enemy", "hazard"].includes(entity.kind)) {
        ctx.beginPath();
        ctx.ellipse(0, 0, entity.width / 2, entity.height / 2, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "#ffffff88";
        ctx.lineWidth = Math.max(2, width / 480);
        ctx.stroke();
      } else {
        ctx.beginPath();
        ctx.roundRect(-entity.width / 2, -entity.height / 2, entity.width, entity.height, Math.min(12, entity.height / 4));
        ctx.fill();
        if (entity.kind === "goal") {
          ctx.strokeStyle = "#d9ffe9"; ctx.lineWidth = 4;
          ctx.strokeRect(-entity.width / 2 + 5, -entity.height / 2 + 5, entity.width - 10, entity.height - 10);
        }
      }
      ctx.restore();
    };

    const draw = (time: number) => {
      if (stopped) return;
      const delta = Math.min((time - (last || time)) / 1000, .04);
      last = time; elapsed += delta;
      const speed = (player.bodyType === "static" ? 0 : (player.speed ?? Math.max(width, height) * .42)) * delta;
      const oldX = x, oldY = y;
      const gravity = (player.gravityScale ?? 0) > 0 && player.bodyType !== "static";
      if (input.current.left) x -= speed;
      if (input.current.right) x += speed;
      if (gravity) {
        if (input.current.up && grounded) { verticalVelocity = -Math.max(260, height * .62); grounded = false; }
        verticalVelocity += 980 * (player.gravityScale ?? 1) * delta;
        y += verticalVelocity * delta;
      } else {
        if (input.current.up) y -= speed;
        if (input.current.down) y += speed;
      }
      x = Math.max(0, Math.min(width - player.width, x));
      y = Math.max(0, Math.min(height - player.height, y));
      grounded = false;
      for (const platform of entities.filter(item => item.visible && item.kind === "platform" && !item.isSensor)) {
        if (hit(x, y, player.width, player.height, platform.x, platform.y, platform.width, platform.height)) {
          if (gravity && verticalVelocity >= 0 && oldY + player.height <= platform.y + 8) {
            y = platform.y - player.height;
            verticalVelocity = -(verticalVelocity * (player.restitution ?? 0));
            grounded = true;
          } else if (!gravity) { x = oldX; y = oldY; }
          else if (oldX + player.width <= platform.x + 6 || oldX >= platform.x + platform.width - 6) { x = oldX; }
        }
      }
      if (gravity && y + player.height >= height) {
        y = height - player.height; verticalVelocity = -(verticalVelocity * (player.restitution ?? 0)); grounded = true;
      }
      for (const item of entities.filter(item => item.visible && item.kind === "collectible" && !collected.has(item.id))) {
        const p = position(item);
        if (hit(x, y, player.width, player.height, p.x, p.y, item.width, item.height)) {
          collected.add(item.id); points += 10; setScore(points);
        }
      }
      for (const goal of entities.filter(item => item.visible && item.kind === "goal")) {
        if (hit(x, y, player.width, player.height, goal.x, goal.y, goal.width, goal.height)) {
          stopped = true; finalStatus = "won"; setStatus("won"); onCompleteRef.current?.();
        }
      }
      for (const danger of entities.filter(item => !stopped && item.visible && (item.kind === "enemy" || item.kind === "hazard"))) {
        const p = position(danger);
        if (elapsed >= invulnerableUntil && hit(x, y, player.width, player.height, p.x, p.y, danger.width, danger.height)) {
          health -= 1; setLives(health); invulnerableUntil = elapsed + 1.1; x = player.x; y = player.y;
          if (health <= 0) { stopped = true; finalStatus = "lost"; setStatus("lost"); }
        }
      }

      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = scene.background; ctx.fillRect(0, 0, width, height);
      ctx.save(); ctx.globalAlpha = .12; ctx.strokeStyle = "#d9efff"; ctx.lineWidth = 1;
      for (let gx = 0; gx < width; gx += 48) { ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, height); ctx.stroke(); }
      for (let gy = 0; gy < height; gy += 48) { ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(width, gy); ctx.stroke(); }
      ctx.restore();
      for (const entity of entities) {
        if (!entity.visible || entity.kind === "player" || (entity.kind === "collectible" && collected.has(entity.id))) continue;
        drawEntity(entity);
      }
      ctx.save();
      ctx.fillStyle = player.color;
      ctx.beginPath(); ctx.roundRect(x, y, player.width, player.height, 12); ctx.fill();
      ctx.fillStyle = "#ffffff";
      ctx.beginPath(); ctx.arc(x + player.width * .32, y + player.height * .38, Math.max(2, player.width * .06), 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(x + player.width * .68, y + player.height * .38, Math.max(2, player.width * .06), 0, Math.PI * 2); ctx.fill();
      ctx.restore();

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
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      input.current = { up: false, down: false, left: false, right: false };
    };
  }, [scene, active]);

  function press(key: keyof Input, value: boolean) { input.current[key] = value; }
  return <div className="studio-runner">
    <div className="studio-runner-bar"><strong>{language === "fa" ? "اجرای زنده صحنه" : "LIVE SCENE"}</strong><span>{language === "fa" ? "امتیاز" : "Score"}: {score}</span><span>{language === "fa" ? "جان" : "Lives"}: {lives}</span>
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
    </div>
    <p className="studio-muted">{language === "fa" ? "کنترل: کلیدهای جهت یا WASD · موبایل: دکمه‌های لمسی · آیتم‌ها را جمع کن، از خطرها دوری کن و به دروازه برس." : "Keyboard: arrows / WASD · Touch: directional pad · Collect items, avoid hazards, reach the goal."}</p>
  </div>;
}
