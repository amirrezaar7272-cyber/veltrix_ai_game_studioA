"use client";

import { useEffect, useRef } from "react";
import Phaser from "phaser";

export default function GamePreview({ template }: { template: string }) {
  const host = useRef<HTMLDivElement>(null);
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
          this.add.text(12, 8, "DODGE · use arrow keys", { color: "#ffffff", fontSize: "10px" });
        } else {
          for (let i = 0; i < 5; i++) this.coins.push(this.add.circle(35 + i * 60, 80, 7, 0xffd166));
          this.add.text(12, 8, "COLLECT · use arrow keys", { color: "#ffffff", fontSize: "10px" });
        }
      }
      update() {
        const speed = 2.5;
        if (this.cursors.left.isDown) this.player.x -= speed;
        if (this.cursors.right.isDown) this.player.x += speed;
        if (this.cursors.up.isDown) this.player.y -= speed;
        if (this.cursors.down.isDown) this.player.y += speed;
        this.player.x = Phaser.Math.Clamp(this.player.x, 12, 308);
        this.player.y = Phaser.Math.Clamp(this.player.y, 45, 208);
      }
    }
    const game = new Phaser.Game({ type: Phaser.AUTO, width: 320, height: 220, parent: host.current, scene: Demo, backgroundColor: "#101a31", scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH } });
    return () => game.destroy(true);
  }, [template]);
  return <div className="game-frame"><div ref={host} /></div>;
}
