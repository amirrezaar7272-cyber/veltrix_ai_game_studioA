# VELTRIX AI — BEYOND INTELLIGENCE

A bilingual, mobile-friendly 2D game-studio project. The current frontend combines an optional on-device language model with an editable scene/project workspace.

## Current frontend capabilities

- Persian and English game prompts.
- Optional Qwen2.5 0.5B in-browser inference through WebLLM and WebGPU; no AI API key is required for this path.
- Lightweight rule-based fallback when WebGPU or device resources are unavailable.
- Versioned project format (schemaVersion 1) with scenes and typed entities.
- Scene editor for background, dimensions, and scene names.
- Entity creation and inspection for player, enemy, collectible, platform, and decoration objects.
- Basic playable canvas runtime with keyboard and touch movement, collectible scoring, enemy collisions, and lives.
- Local browser project library plus .veltrix JSON import/export.

## Run locally

Requirements: Node.js 20+ and npm.

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:3000.

## On-device model

The optional local model needs a compatible WebGPU browser/GPU and an initial model download. The current model is Qwen2.5 0.5B (quantized). Actual compatibility and memory use vary by device. On unsupported or constrained devices, VELTRIX uses its lightweight local fallback. Prompts for this local path are not sent to an AI API.

## Storage and project portability

Projects are saved in the browser's localStorage on the current device/browser profile. Use Export .veltrix to create a portable backup and Import project to restore it elsewhere. Clearing browser storage can remove locally saved projects; export backups regularly.

## Current limitations — important

This is an actively developed foundation, not yet a finished commercial game engine. The runtime currently supports basic top-down movement and simple collectible/enemy/platform interactions. It does not yet provide a full physics engine, animation timeline, sprite/asset pipeline, advanced level logic, arbitrary generated game code, multiplayer, or Android APK packaging. The scene editor and runtime are separate from the older Phaser demo preview.

The repository also contains a legacy optional FastAPI/Gemini backend and Render configuration. The current local-first frontend does not require that backend; deploying it would introduce an external service and API-key dependency.

## Build

```bash
cd frontend
npm install
npx tsc --noEmit
npm run build
```

GitHub Actions runs the frontend build on pushes and pull requests targeting main.
