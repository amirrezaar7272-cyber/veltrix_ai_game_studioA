"use client";

import { useEffect, useRef, useState } from "react";
import type { GameScene } from "../lib/project";

type Props = { scene: GameScene; active: boolean };
type Input = { up: boolean; down: boolean; left: boolean; right: boolean };

export default function GameRunner({ scene, active }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const input = useRef<Input>({ up: false, down: false, left: false, right: false });
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [running, setRunning] = useState(true);

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
    if (!player) { setRunning(false); return; }
    const collected = new Set<string>();
    let x = player.x, y = player.y, points = 0, health = 3, last = 0, elapsed = 0;
    let stopped = false, frame = 0, invulnerableUntil = 0;
    setScore(0); setLives(3); setRunning(true);
    const keys: Record<string, keyof Input> = {
      ArrowUp: "up", w: "up", W: "up", ArrowDown: "down", s: "down", S: "down",
      ArrowLeft: "left", a: "left", A: "left", ArrowRight: "right", d: "right", D: "right"
    };
    const down = (event: KeyboardEvent) => { const key = keys[event.key]; if (key) { event.preventDefault(); input.current[key] = true; } };
    const up = (event: KeyboardEvent) => { const key = keys[event.key]; if (key) { event.preventDefault(); input.current[key] = false; } };
    window.addEventListener("keydown", down); window.addEventListener("keyup", up);
    const hit = (ax: number, ay: number, aw: number, ah: number, bx: number, by: number, bw: number, bh: number) =>
      ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
    const draw = (time: number) => {
      if (stopped) return;
      const delta = Math.min((time - (last || time)) / 1000, 0.04); last = time; elapsed += delta;
      const speed = Math.max(width, height) * 0.42 * delta;
      const oldX = x, oldY = y;
      if (input.current.left) x -= speed;
      if (input.current.right) x += speed;
      if (input.current.up) y -= speed;
      if (input.current.down) y += speed;
      x = Math.max(0, Math.min(width - player.width, x));
      y = Math.max(0, Math.min(height - player.height, y));
      for (const obstacle of entities.filter(e => e.visible && e.kind === "platform")) {
        if (hit(x, y, player.width, player.height, obstacle.x, obstacle.y, obstacle.width, obstacle.height)) { x = oldX; y = oldY; break; }
      }
      for (const item of entities.filter(e => e.visible && e.kind === "collectible" && !collected.has(e.id))) {
        if (hit(x, y, player.width, player.height, item.x, item.y, item.width, item.height)) {
          collected.add(item.id); points += 10; setScore(points);
        }
      }
      for (const enemy of entities.filter(e => e.visible && e.kind === "enemy")) {
        const drift = Math.sin(elapsed * 1.8 + enemy.x * 0.01) * Math.min(35, width * 0.04);
        if (hit(x, y, player.width, player.height, enemy.x + drift, enemy.y, enemy.width, enemy.height)) {
          health -= 1; setLives(health); x = player.x; y = player.y;
          if (health <= 0) stopped = true;
        }
      }
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = scene.background; ctx.fillRect(0, 0, width, height);
      ctx.save(); ctx.globalAlpha = 0.12; ctx.strokeStyle = "#d9efff"; ctx.lineWidth = 1;
      for (let gx = 0; gx < width; gx += 48) { ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, height); ctx.stroke(); }
      for (let gy = 0; gy < height; gy += 48) { ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(width, gy); ctx.stroke(); }
      ctx.restore();
      for (const entity of entities) {
        if (!entity.visible || entity.kind === "player" || collected.has(entity.id)) continue;
        const drift = entity.kind === "enemy" ? Math.sin(elapsed * 1.8 + entity.x * 0.01) * Math.min(35, width * 0.04) : 0;
        ctx.fillStyle = entity.color;
        if (entity.kind === "collectible" || entity.kind === "enemy") {
          ctx.beginPath(); ctx.ellipse(entity.x + drift + entity.width / 2, entity.y + entity.height / 2, entity.width / 2, entity.height / 2, 0, 0, Math.PI * 2); ctx.fill();
          ctx.strokeStyle = "#ffffff88"; ctx.lineWidth = Math.max(2, width / 480); ctx.stroke();
        } else {
          ctx.beginPath(); ctx.roundRect(entity.x, entity.y, entity.width, entity.height, Math.min(10, entity.height / 4)); ctx.fill();
        }
      }
      ctx.fillStyle = player.color; ctx.beginPath(); ctx.roundRect(x, y, player.width, player.height, 12); ctx.fill();
      ctx.fillStyle = "#ffffff"; ctx.beginPath(); ctx.arc(x + player.width * .32, y + player.height * .38, Math.max(2, player.width * .06), 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(x + player.width * .68, y + player.height * .38, Math.max(2, player.width * .06), 0, Math.PI * 2); ctx.fill();
      if (stopped) {
        ctx.fillStyle = "#07111edc"; ctx.fillRect(0, 0, width, height);
        ctx.fillStyle = "#ffffff"; ctx.textAlign = "center"; ctx.font = "bold 30px Arial"; ctx.fillText("GAME OVER", width / 2, height / 2);
        ctx.font = "16px Arial"; ctx.fillText("Score: " + points, width / 2, height / 2 + 32);
        setRunning(false); return;
      }
      frame = requestAnimationFrame(draw);
    };
    frame = requestAnimationFrame(draw);
    return () => {
      stopped = true; cancelAnimationFrame(frame);
      window.removeEventListener("keydown", down); window.removeEventListener("keyup", up);
      input.current = { up: false, down: false, left: false, right: false };
    };
  }, [scene, active]);

  function press(key: keyof Input, value: boolean) { input.current[key] = value; }
  return <div className="studio-runner">
    <div className="studio-runner-bar"><strong>LIVE SCENE</strong><span>Score: {score}</span><span>Lives: {lives}</span>{!running && <span>Finished</span>}</div>
    <canvas ref={canvasRef} className="studio-runner-canvas" />
    <div className="studio-runner-controls">
      <span />
      <button onPointerDown={() => press("up", true)} onPointerUp={() => press("up", false)} onPointerLeave={() => press("up", false)} onPointerCancel={() => press("up", false)}>▲</button>
      <span />
      <button onPointerDown={() => press("left", true)} onPointerUp={() => press("left", false)} onPointerLeave={() => press("left", false)} onPointerCancel={() => press("left", false)}>◀</button>
      <button onPointerDown={() => press("down", true)} onPointerUp={() => press("down", false)} onPointerLeave={() => press("down", false)} onPointerCancel={() => press("down", false)}>▼</button>
      <button onPointerDown={() => press("right", true)} onPointerUp={() => press("right", false)} onPointerLeave={() => press("right", false)} onPointerCancel={() => press("right", false)}>▶</button>
    </div>
    <p className="studio-muted">Move with arrow keys / WASD or touch controls. Collect items and avoid enemies.</p>
  </div>;
}
