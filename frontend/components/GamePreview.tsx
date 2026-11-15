"use client";

import { useEffect, useRef } from "react";
import type PhaserTypes from "phaser";

type Direction = "up" | "down" | "left" | "right";
type TouchState = Record<Direction, boolean>;

export default function GamePreview({ template, theme = "Fantasy" }: { template: string; theme?: string }) {
  const host = useRef<HTMLDivElement>(null);
  const touch = useRef<TouchState>({ up: false, down: false, left: false, right: false });

  function setDirection(direction: Direction, pressed: boolean) {
    touch.current[direction] = pressed;
  }

  useEffect(() => {
    let disposed = false;
    let game: PhaserTypes.Game | undefined;
    const start = async () => {
    const Phaser = (await import("phaser")).default;
    if (disposed || !host.current) return;
    const themeKey = theme.toLocaleLowerCase();
    const palette = themeKey.includes("space") || themeKey.includes("فضا")
      ? { skyTop: 0x102b50, skyBottom: 0x172b50, far: 0x173b50, near: 0x1c594f, player: 0x168ab5, glow: 0x54d9ed, coin: 0xffb52e, coinLight: 0xffe78a, rock: 0x7c4055, rockLight: 0xe47779, name: "COSMIC" }
      : themeKey.includes("forest") || themeKey.includes("جنگل")
      ? { skyTop: 0x163d36, skyBottom: 0x244c37, far: 0x244d3c, near: 0x39734a, player: 0x2b8b55, glow: 0x8be0a0, coin: 0xe9a83c, coinLight: 0xffe39a, rock: 0x574b35, rockLight: 0x9b8050, name: "WILD" }
      : themeKey.includes("cyber") || themeKey.includes("سایبر")
      ? { skyTop: 0x180e3d, skyBottom: 0x32134b, far: 0x30204f, near: 0x4a2360, player: 0x8a42c5, glow: 0x52f2e5, coin: 0xff4fc8, coinLight: 0xffb4eb, rock: 0x542b75, rockLight: 0xc05cff, name: "NEON" }
      : { skyTop: 0x34204f, skyBottom: 0x57345f, far: 0x49315e, near: 0x755078, player: 0x477bd1, glow: 0xa8e8ff, coin: 0xffb52e, coinLight: 0xffe78a, rock: 0x7c4055, rockLight: 0xe47779, name: "FANTASY" };

    class Demo extends Phaser.Scene {
      player!: PhaserTypes.GameObjects.Container;
      cursors!: PhaserTypes.Types.Input.Keyboard.CursorKeys;
      coins: Phaser.GameObjects.Container[] = [];
      hazards: Phaser.GameObjects.Container[] = [];
      score = 0;
      elapsed = 0;
      ended = false;
      scoreLabel!: Phaser.GameObjects.Text;
      overlay?: Phaser.GameObjects.Container;

      create() {
        const sparkTexture = this.make.graphics({ x: 0, y: 0 });
        sparkTexture.fillStyle(0xffffff, 1).fillCircle(4, 4, 4);
        sparkTexture.generateTexture("spark", 8, 8);
        sparkTexture.destroy();
        const sky = this.add.graphics();
        sky.fillGradientStyle(palette.skyTop, palette.skyTop, palette.skyBottom, palette.skyBottom, 1);
        sky.fillRect(0, 0, 320, 220);
        // Distant planets, stars and layered hills give the scene depth.
        this.add.circle(270, 48, 24, 0x5e8bb0, 0.22);
        this.add.circle(270, 48, 17, 0x9ac7d8, 0.18);
        for (let i = 0; i < 34; i++) {
          const x = Phaser.Math.Between(5, 315), y = Phaser.Math.Between(12, 150);
          this.add.circle(x, y, Phaser.Math.FloatBetween(0.6, 1.7), 0xffffff, Phaser.Math.FloatBetween(0.25, 0.8));
        }
        const hills = this.add.graphics();
        hills.fillStyle(palette.far, 1);
        hills.fillPoints([{x:0,y:170},{x:38,y:140},{x:85,y:165},{x:130,y:132},{x:188,y:165},{x:238,y:137},{x:320,y:164},{x:320,y:220},{x:0,y:220}], true);
        hills.fillStyle(palette.near, 1);
        hills.fillPoints([{x:0,y:190},{x:55,y:165},{x:105,y:187},{x:165,y:157},{x:225,y:185},{x:280,y:160},{x:320,y:180},{x:320,y:220},{x:0,y:220}], true);
        this.add.rectangle(160, 215, 320, 10, 0x102b39).setAlpha(0.8);
        this.add.text(12, 9, (template === "dodge" ? "SKY RUNNER" : "CRYSTAL QUEST") + " · " + palette.name, {
          fontFamily: "Arial", fontSize: "11px", fontStyle: "bold", color: "#dff7ff", letterSpacing: 2
        });
        this.scoreLabel = this.add.text(307, 9, "SCORE  000", {
          fontFamily: "Arial", fontSize: "10px", fontStyle: "bold", color: "#ffe6a3"
        }).setOrigin(1, 0);

        this.player = this.add.container(160, 178);
        this.player.add([
          this.add.ellipse(0, 13, 30, 8, 0x061629, 0.38),
          this.add.ellipse(0, 1, 24, 28, palette.player),
          this.add.ellipse(0, -2, 21, 23, palette.glow),
          this.add.ellipse(-4, -6, 7, 9, 0xffffff, 0.45),
          this.add.ellipse(0, 3, 15, 10, 0x102c52),
          this.add.ellipse(-4, 2, 3, 4, 0xffffff),
          this.add.ellipse(4, 2, 3, 4, 0xffffff),
          this.add.ellipse(-8, 12, 7, 5, 0x16709a),
          this.add.ellipse(8, 12, 7, 5, 0x16709a)
        ]);
        this.tweens.add({ targets: this.player, y: 175, duration: 620, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
        this.cursors = this.input.keyboard!.createCursorKeys();

        if (template === "dodge") {
          for (let i = 0; i < 4; i++) this.spawnHazard(38 + i * 82, 38 - i * 54);
          this.add.text(12, 195, "DODGE THE METEORS", { fontSize: "8px", color: "#b8d9ee", fontStyle: "bold" });
        } else {
          for (let i = 0; i < 5; i++) this.spawnCoin(34 + i * 62, 76 + (i % 2) * 28);
          this.add.text(12, 195, "COLLECT EVERY CRYSTAL", { fontSize: "8px", color: "#b8d9ee", fontStyle: "bold" });
        }
      }

      spawnCoin(x: number, y: number) {
        const coin = this.add.container(x, y);
        coin.add([
          this.add.circle(0, 2, 11, 0x8a4d22, 0.45),
          this.add.circle(0, 0, 10, palette.coin),
          this.add.circle(0, 0, 7, palette.coinLight),
          this.add.star(-1, -1, 4, 2, 4, 0xffa51e),
          this.add.ellipse(-4, -5, 4, 7, 0xffffff, 0.7)
        ]);
        this.tweens.add({ targets: coin, y: y - 5, duration: 720 + (x % 3) * 100, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
        this.coins.push(coin);
      }

      spawnHazard(x: number, y: number) {
        const rock = this.add.container(x, y);
        rock.add([
          this.add.ellipse(1, 9, 33, 13, 0x061426, 0.38),
          this.add.circle(0, 0, 14, palette.rock),
          this.add.circle(-2, -2, 11, palette.rockLight),
          this.add.circle(-6, -5, 4, 0xffb0a0, 0.8),
          this.add.circle(6, 5, 3, 0x873e55),
          this.add.circle(8, -7, 2, 0xffc2a8, 0.8)
        ]);
        this.hazards.push(rock);
      }

      addScore(amount: number) {
        this.score += amount;
        this.scoreLabel.setText("SCORE  " + String(this.score).padStart(3, "0"));
      }

      finish() {
        if (this.ended) return;
        this.ended = true;
        this.tweens.killTweensOf(this.player);
        const shade = this.add.rectangle(160, 110, 320, 220, 0x071323, 0.78);
        const title = this.add.text(160, 82, "NICE TRY!", { fontSize: "25px", fontStyle: "bold", color: "#ffffff", stroke: "#173c59", strokeThickness: 4 }).setOrigin(0.5);
        const score = this.add.text(160, 117, "FINAL SCORE  " + this.score, { fontSize: "12px", color: "#ffe39a", fontStyle: "bold" }).setOrigin(0.5);
        const retry = this.add.text(160, 157, "  PLAY AGAIN  ", { fontSize: "12px", color: "#082038", backgroundColor: "#73e3ed", padding: { x: 12, y: 9 }, fontStyle: "bold" }).setOrigin(0.5).setInteractive({ useHandCursor: true });
        retry.on("pointerdown", () => this.scene.restart());
        this.overlay = this.add.container(0, 0, [shade, title, score, retry]);
        this.player.setVisible(false);
      }

      update(_time: number, delta: number) {
        if (this.ended) return;
        const speed = 175 * delta / 1000;
        if (this.cursors.left.isDown || touch.current.left) this.player.x -= speed;
        if (this.cursors.right.isDown || touch.current.right) this.player.x += speed;
        if (this.cursors.up.isDown || touch.current.up) this.player.y -= speed;
        if (this.cursors.down.isDown || touch.current.down) this.player.y += speed;
        this.player.x = Phaser.Math.Clamp(this.player.x, 16, 304);
        this.player.y = Phaser.Math.Clamp(this.player.y, 48, 192);

        const playerBox = new Phaser.Geom.Rectangle(this.player.x - 10, this.player.y - 10, 20, 22);
        if (template === "dodge") {
          this.elapsed += delta;
          if (this.elapsed >= 1000) { this.elapsed -= 1000; this.addScore(1); }
          for (const rock of this.hazards) {
            rock.y += (75 + Math.min(this.score, 50)) * delta / 1000;
            if (rock.y > 235) { rock.y = -Phaser.Math.Between(25, 100); rock.x = Phaser.Math.Between(20, 300); }
            const hit = new Phaser.Geom.Rectangle(rock.x - 12, rock.y - 11, 24, 22);
            if (Phaser.Geom.Intersects.RectangleToRectangle(playerBox, hit)) { this.finish(); return; }
          }
        } else {
          for (let i = this.coins.length - 1; i >= 0; i--) {
            const coin = this.coins[i];
            const hit = new Phaser.Geom.Rectangle(coin.x - 9, coin.y - 9, 18, 18);
            if (Phaser.Geom.Intersects.RectangleToRectangle(playerBox, hit)) {
              this.addScore(10);
              const burst = this.add.particles(coin.x, coin.y, "spark", { speed: { min: 25, max: 90 }, lifespan: 350, quantity: 10, scale: { start: 0.7, end: 0 }, emitting: false });
              burst.explode(10);
              coin.destroy();
              this.coins.splice(i, 1);
              this.time.delayedCall(850, () => { if (!this.ended) this.spawnCoin(Phaser.Math.Between(22, 298), Phaser.Math.Between(58, 155)); });
            }
          }
        }
      }
    }

    game = new Phaser.Game({
      type: Phaser.AUTO, width: 320, height: 220, parent: host.current,
      scene: Demo, backgroundColor: "#102b50",
      scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH }
    });
    };
    void start().catch(error => {
      if (!disposed) console.error("VELTRIX preview failed to initialize:", error);
    });
    return () => {
      disposed = true;
      touch.current = { up: false, down: false, left: false, right: false };
      game?.destroy(true);
    };
  }, [template, theme]);

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
