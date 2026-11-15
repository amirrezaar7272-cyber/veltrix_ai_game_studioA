# VELTRIX AI — BEYOND INTELLIGENCE

VELTRIX is a local-first, bilingual 2D game-studio prototype. It combines an optional on-device language model, a structured scene editor, local project management, and a lightweight playable runtime.

## Current studio features

- Persian and English prompt interface.
- Optional Qwen2.5 0.5B in-browser inference through WebLLM/WebGPU; the frontend's local path needs no AI API key or paid inference server.
- Rule-based local fallback for devices that cannot run the larger model.
- Versioned project files with multiple scenes and typed entities.
- Scene creation, duplication, deletion, renaming, background color and canvas dimensions.
- Drag-and-drop object placement, optional 16px snapping, canvas zoom and layer ordering.
- Entity inspector for position, size, color, visibility, rotation, opacity, movement behavior and speed.
- Entity types: player, enemy, collectible, platform, decoration, hazard, goal and NPC.
- Runtime movement with keyboard and touch controls, collectible scoring, lives, invulnerability after damage, moving/pursuing enemies, hazards, goal completion and sequential multi-scene playthrough.
- Initial physics authoring controls per entity: body type, mass, friction, restitution, gravity scale and sensor flag. Runtime currently supports basic gravity, jump, platform landing and bounce for the player; it is not a full rigid-body solver.
- Initial keyframe timeline: record object poses at timestamps and apply a saved pose manually. Timeline playback, interpolation/easing and persistence inside project files are not implemented yet.
- Local audio preview: import and play an audio file in the current browser session, choose music/effect mode and adjust volume. Audio asset persistence and in-game event playback are not implemented yet.
- Visual logic graph authoring: add event/action/condition nodes and connect them. Runtime graph execution and event bindings are not implemented yet.
- Android build-kit manifest export with app ID and Capacitor/Android Studio build instructions. This is not an APK; a real APK still requires a production web build, Capacitor project setup, Android SDK and Gradle.
- Debounced local auto-save, manual save, project list, and portable .veltrix import/export.
- Responsive layout for mobile and desktop.

## Run locally

Requirements: Node.js 20+ and npm.

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:3000.

For a production build:

```bash
npx tsc --noEmit
npm run build
```

## On-device model

The optional local model requires a compatible WebGPU browser/GPU and an initial model download. The current model is Qwen2.5 0.5B (quantized). Compatibility and memory use vary by device. On unsupported or constrained devices, VELTRIX uses its lightweight local fallback. Prompts processed through this local path are not sent to an AI API.

## Project storage

Projects are stored in localStorage in the current browser profile. Auto-save is enabled. Use Export .veltrix for a backup before clearing browser data or switching devices. Import a .veltrix or JSON project to restore it.

## Known limitations

This is a growing studio foundation, not yet a finished commercial game engine. The new physics, animation, audio and visual-logic panels are first implementation layers with the limitations listed above; a complete rigid-body solver, timeline playback/interpolation, persistent audio asset pipeline, executable visual scripting, skeletal animation, sprite/asset pipeline, advanced pathfinding, multiplayer and native APK compilation remain future work. The local AI model generates a compact design suggestion; it does not autonomously generate arbitrary production-ready game code or art assets.

The repository also contains a legacy optional FastAPI/Gemini backend and Render configuration. The local-first frontend does not require that backend. Deploying the legacy backend introduces external-service and API-key dependencies.

## Continuous integration

GitHub Actions runs TypeScript validation and a Next.js production build on pushes and pull requests targeting the main branch.
