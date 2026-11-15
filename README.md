# VELTRIX AI — BEYOND INTELLIGENCE

VELTRIX is a local-first, bilingual 2D game-studio foundation. It combines an optional on-device language model, scene authoring, a playable canvas runtime, physics, keyframe animation, embedded audio, event-driven visual logic, and an Android packaging workflow.

## Studio capabilities

- Persian and English prompt interface.
- Optional Qwen2.5 0.5B in-browser inference through WebLLM/WebGPU; no AI API key or paid inference server is required. A lightweight local fallback is used on unsupported devices.
- Versioned .veltrix projects with multiple scenes, entity types, project validation, local auto-save and import/export.
- Drag-and-drop scene editor, grid snapping, zoom, layer ordering, keyboard shortcuts and entity inspector.
- Playable 2D runtime with keyboard and touch input, score, lives, collectibles, hazards, goals and scene progression.
- Deterministic 2D AABB physics world with fixed-size substeps, gravity, body types, mass-aware collision response, friction, restitution, platform landing and jump input. It is an arcade/platformer solver, not a general 3D or constraint-based rigid-body engine.
- Per-entity keyframe tracks with interpolation, linear/ease-in/ease-out/ease-in-out curves, duration and looping. Tracks can be previewed in the editor and sampled during gameplay.
- Scene audio library: up to two audio files per scene, each up to 1 MB, embedded in .veltrix project data; volume and music/effect mode are configurable. Audio can be triggered by visual logic nodes. Browser autoplay rules still apply.
- Directed visual event graph with start, collision, collect and goal triggers; move, wait, play-audio, set-visible and set-score actions. Graph traversal is bounded to prevent cyclic graphs from hanging the game loop.
- Capacitor configuration and GitHub Actions workflow to compile a debug Android APK and publish it as a workflow artifact.
- Responsive mobile and desktop UI.

## Run locally

Requirements: Node.js 20+ and npm.

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:3000.

For validation and static production output:

```bash
npx tsc --noEmit
npm run build
```

## Build an Android APK

1. Open the repository's **Actions** tab.
2. Select **Android APK build** and choose **Run workflow**.
3. Keep the default application ID or enter a valid reverse-domain ID such as `com.example.mygame`.
4. Wait for the workflow to finish, then download the `veltrix-ai-debug-apk` artifact from that run.
5. Install and test the debug APK on a real Android device. A release APK/AAB still needs signing configuration before store distribution.

The workflow uses GitHub-hosted build runners, Node.js, Capacitor, Java and Gradle. The APK is built remotely by GitHub Actions, not on the phone. The current Android package is a WebView wrapper around the static web export; WebGPU/model support depends on the Android WebView/device and may fall back to the lightweight local brain.

## On-device model

The optional local model requires a compatible WebGPU browser/GPU and an initial model download. The current model is Qwen2.5 0.5B (quantized). Compatibility and memory use vary by device. On unsupported or constrained devices, VELTRIX uses its lightweight local fallback. Prompts processed through this local path are not sent to an AI API.

## Project storage

Projects are stored in the current browser profile. Use Export .veltrix for a backup before clearing browser data or switching devices. Embedded audio is included in exported project files. Audio is limited to two files per scene and 1 MB per file to avoid exceeding typical browser storage quotas.

## Current engineering limits

This is not yet a finished commercial game engine. Physics is 2D axis-aligned collision handling rather than a full rigid-body solver; there is no joint/constraint system, continuous collision detection for fast projectiles, or 3D physics. Animation is transform keyframes only, without skeletal rigs, sprite sheets or a full curve editor. Audio supports embedded short clips and event-triggered playback, not a multitrack mixer, streaming music pipeline or advanced spatial audio. Visual scripting supports a bounded set of events/actions and does not yet include arbitrary user code, branching expressions, variables or a debugger. Android automation currently creates a debug APK; signing, release AAB, store publishing and native plugin integrations remain separate work. No physical-device test is claimed until an APK is installed and exercised on target phones.

## Continuous integration

The frontend workflow runs TypeScript validation and a Next.js static production build on pushes and pull requests targeting `main`. The Android workflow builds a debug APK and uploads it as an artifact.
