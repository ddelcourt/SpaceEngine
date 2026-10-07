# Space Engine

A lightweight browser-based 3D first-person inspection and object-editing experience built with [p5.js](https://p5js.org/) in WebGL mode. No build step. No dependencies to install. Open in a browser and walk.

---

## What it is

Space Engine is a modular 3D engine designed to evolve into a gallery-like spatial application — a place where you can walk around objects, inspect them up close, select and style them, and persist your changes across sessions.

The driving idea: build a solid technical foundation first, then layer interaction, persistence, texture authoring, and mobile support on top — without reworking the core.

---

## v0.1 — 3D World with User Interaction

This first milestone establishes the complete interactive foundation of the engine.

### What works

**First-person movement**  
Walk with `W A S D`, look with the mouse. Click the canvas to enter pointer lock. Press `Escape` to release. Movement is delta-time normalised and collision-aware.

**3D scene**  
Four primitive types — cube, sphere, cone, pyramid — scattered randomly across the scene using seeded placement (stable across reloads). All primitives sit on a flat ground grid that fades with distance.

**Hover and selection**  
Look at any object. The reticle turns green, and the info panel slides in with the object's name and position. Click or press `E` to select. Selected objects glow with a golden ring at their base.

**Live control pane**  
Press `Tab` to show or hide the left-side panel. Every setting — field of view, movement speed, object counts, selection hotspot — is adjustable in real time and persisted to `localStorage` automatically.

### Controls

| Input | Action |
|---|---|
| `W A S D` | Move |
| Mouse | Look |
| Click canvas | Lock pointer / Select object |
| `E` | Select / deselect object |
| `Escape` | Release pointer lock |
| `Tab` | Toggle control pane |

---

## Running it

No install or build required. Serve the project root with any static file server:

```bash
# Python
python3 -m http.server 5500

# Node (npx)
npx serve .

# VS Code
# Use the Live Server extension, open index.html
```

Then open `http://localhost:5500` in your browser.

---

## Project structure

```
SpaceEngine/
├── index.html
├── style.css               # Swiss-style UI (Inter font, custom sliders)
├── lib/
│   └── p5.min.js           # Vendored, no CDN dependency
└── src/
    ├── main.js
    ├── Engine.js            # Main loop, wires all systems
    ├── CameraRig.js         # First-person camera, perspective projection
    ├── CameraMath.js        # Forward / right vector math
    ├── Player.js            # Movement, look, collision integration
    ├── Floor.js             # Flat XZ grid rendered as thin quads
    ├── Clock.js             # Delta-time
    ├── Settings.js          # Schema-driven settings (single source of truth)
    ├── SettingsStore.js     # localStorage persistence with validation
    ├── input/
    │   ├── InputManager.js
    │   └── KeyboardMouseInput.js
    ├── interaction/
    │   ├── Raycaster.js     # Sphere ray-intersection, configurable hotspot
    │   └── SelectionManager.js
    ├── physics/
    │   ├── CollisionSystem.js
    │   ├── CircleCollider.js
    │   └── AABBCollider.js
    ├── ui/
    │   ├── ControlPane.js   # Live settings panel, Tab toggle
    │   ├── InfoPanel.js     # Hover / selection info panel
    │   └── Reticle.js       # DOM-based centre-screen circle
    └── world/
        ├── World.js
        ├── SceneObject.js   # Base class: draw, state, hover/select visuals
        ├── ObjectSpawner.js # Seeded random placement, count reconciliation
        ├── MeshBuilder.js   # Primitive mesh factories with explicit normals
        ├── Cube.js
        ├── Pyramid.js
        ├── Cone.js
        └── Sphere.js
```

---

## Roadmap

The project is delivered in eight slices:

| Slice | Title | Status |
|---|---|---|
| 1 | Foundation and runtime core | ✅ Done |
| 2 | Movement, collision, navigation | ✅ Done |
| 3 | Scene objects and world generation | ✅ Done |
| 4 | Interaction and selection | ✅ Done |
| 5 | Control pane and persistence | 🔜 Next |
| 6 | Texture and UV authoring | — |
| 7 | Mobile and performance | — |
| 8 | Polish, debugging, release | — |

---

## Technical notes

- **No build step** — plain ES modules, runs directly in the browser.
- **Vendored p5.js** — `lib/p5.min.js` is included; no CDN required.
- **Settings schema** — a single `Settings.js` object drives the control pane UI, runtime behaviour, and localStorage persistence simultaneously. Adding a new parameter means one schema entry.
- **Raycasting** — sphere approximation with a configurable `hotspot` multiplier (default 0.5). Adjust in the *Interaction* section of the control pane to suit scene density.
- **Coordinate system** — Y-up, right-handed. Ground plane at Y = 0. Camera eye height at Y = 1.8.

---

## License

MIT
