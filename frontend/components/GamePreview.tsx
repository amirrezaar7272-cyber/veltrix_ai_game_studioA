"use client";

import { useEffect, useRef } from "react";
import Phaser from "phaser";

type Direction = "up" | "down" | "left" | "right";
type TouchState = Record<Direction, boolean>;

export default function GamePreview({ template }: { template: string }) {
  const host = useRef<HTMLDivElement>(null);
  const touch = useRef<TouchState>({ up: false, down: false, left: false, right: false });

  function setDirection(direction: Direction, pressed: boolean) {
    touch.current[direction] = pressed;
  }

  useEffect(() => {
    if (!host.current) return;
    class Demo extends Phaser.Scene {
      player!: Phaser.GameObjects.Rectangle;
      cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
      coins: Phaser.GameObjects.Arc[] = [];
      create() {
        this.add.rectangle(160, 110, 320, 220, 0x101a31);
        this.player = this.add.rectangle(160, 180, 22, 22, 0x69e6ff);
        this.cursors = this.input.keyboard!.createCursorKeys();
        if (template === "dodge") {
          for (let i = 0; i < 5; i++) this.add.rectangle(35 + i * 60, 35, 18, 18, 0xff6b8a);
          this.add.text(12, 8, "DODGE · arrows or touch pad", { color: "#ffffff", fontSize: "10px" });
        } else {
          for (let i = 0; i < 5; i++) this.coins.push(this.add.circle(35 + i * 60, 80, 7, 0xffd166));
          this.add.text(12, 8, "COLLECT · arrows or touch pad", { color: "#ffffff", fontSize: "10px" });
        }
      }
      update() {
        const speed = 2.5;
        if (this.cursors.left.isDown || touch.current.left) this.player.x -= speed;
        if (this.cursors.right.isDown || touch.current.right) this.player.x += speed;
        if (this.cursors.up.isDown || touch.current.up) this.player.y -= speed;
        if (this.cursors.down.isDown || touch.current.down) this.player.y += speed;
        this.player.x = Phaser.Math.Clamp(this.player.x, 12, 308);
        this.player.y = Phaser.Math.Clamp(this.player.y, 45, 208);
      }
    }
    const game = new Phaser.Game({ type: Phaser.AUTO, width: 320, height: 220, parent: host.current, scene: Demo, backgroundColor: "#101a31", scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH } });
    return () => {
      touch.current = { up: false, down: false, left: false, right: false };
      game.destroy(true);
    };
  }, [template]);

  const control = (direction: Direction, symbol: string, label: string) => (
    <button
      type="button"
      className="game-touch-button"
      aria-label={label}
      onPointerDown={event => { event.preventDefault(); setDirection(direction, true); }}
      onPointerUp={() => setDirection(direction, false)}
      onPointerCancel={() => setDirection(direction, false)}
      onPointerLeave={() => setDirection(direction, false)}
      onContextMenu={event => event.preventDefault()}
    >{symbol}</button>
  );

  return (
    <div className="game-preview-wrap">
      <div className="game-frame"><div ref={host} /></div>
      <div className="game-touch-controls" aria-label="Game touch controls">
        <div className="game-touch-spacer" />
        {control("up", "▲", "Move up")}
        <div className="game-touch-spacer" />
        {control("left", "◀", "Move left")}
        {control("down", "▼", "Move down")}
        {control("right", "▶", "Move right")}
      </div>
      <p className="game-touch-hint">برای حرکت، دکمه‌ها را نگه دار یا از کلیدهای جهت‌نما استفاده کن.</p>
    </div>
  );
}
