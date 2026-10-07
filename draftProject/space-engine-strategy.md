# Space Engine: Strategy and Delivery Slices

## 1. Product intent

Space Engine is a lightweight browser-based 3D first-person inspection and object-editing experience built in p5.js. The project starts as a proof-of-concept scene with four primitives, but the real product is a modular engine that can evolve into a gallery-like spatial application for viewing, selecting, styling, and customizing 3D objects.

The key strategic idea is: build a stable technical foundation first, then layer interaction, persistence, texture tools, and mobile support on top without reworking the core engine.

## 2. Strategic goals

1. Validate the interaction model quickly
   - First-person movement feels natural and smooth.
   - Selection and hover feedback are clear and reliable.
   - The scene is performant enough for desktop and mobile browsers.

2. Build architecture that scales beyond the proof of concept
   - Keep logic modular and object-oriented.
   - Make each primitive a subclass with shared systems.
   - Maintain a single settings schema driving UI, persistence, and runtime behavior.

3. Keep the project practical and buildable
   - No build step.
   - Offline-ready dependencies, vendored locally.
   - Runs in browsers without install friction.

4. Prepare the app for future gallery workflows
   - Objects have identities, metadata hooks, and extensible rendering.
   - UV and texture editing are positioned as a future content system.
   - UI and settings architecture are designed for later expansion.

## 3. Product definition

### Core user value
The user can:
- walk around a small spatial scene,
- inspect object geometry in first person,
- select objects interactively,
- modify or apply textures to them,
- adjust the scene and camera settings live,
- preserve those settings across reloads.

### Application form
A single-page web app with:
- a full-width 3D scene,
- a left-side collapsible control pane,
- right-side or bottom-sheet info panel on selection,
- texture preview + upload + reset workflow,
- simple, deterministic object spawning,
- debug overlays for performance and feature validation.

## 4. Product strategy

### V1: engine foundation and proof-of-concept
Build the smallest complete system that proves the main interaction loop, camera movement, collision, selection, object list management, and settings persistence.

### V2: studio workflow
Add texture authoring and UV template support, object-specific control, and a richer editing flow. This is the transition from "3D scene demo" to "gallery/editor tool".

### V3: scalable content platform
Use the engine as a foundation for more object types, metadata, imported models, and richer scene composition without redesigning the core architecture.

## 5. Slices (delivery workstreams)

### Slice 1 — Foundation and runtime core
Goal: create the bare engine shell and the technical baseline.

Deliverables:
- Engine loop and lifecycle management
- Clock and delta-time handling
- Configuration schema and runtime settings
- Camera and movement math
- Floor rendering and basic lighting
- p5.js/WebGL setup with aspect-ratio handling

Why first:
- Everything else depends on this foundation.
- It reduces risk early and makes UI and gameplay changes testable.

Exit criteria:
- Scene renders at correct aspect ratio.
- Camera movement matches the stated conventions.
- Settings can exist as a single source of truth.

### Slice 2 — Movement, collision, and navigation
Goal: make the scene feel like a real 3D space.

Deliverables:
- Player movement using delta time and normalized vectors
- Mouse/keyboard input and pointer lock behavior
- Mobile joystick + look handling
- Collision with world bounds and object colliders
- Sliding behavior and anti-tunneling logic

Why second:
- The engine must feel responsive before richer systems are added.
- The movement model defines the rest of the interaction design.

Exit criteria:
- No clipping into world bounds or objects.
- Diagonal movement is normalized.
- Smooth movement at 60 FPS.

### Slice 3 — Scene objects and world generation
Goal: make the scene dynamic and extensible.

Deliverables:
- SceneObject base abstraction
- Primitive classes: cube, pyramid, cone, sphere
- Mesh generation with UV layout support
- Deterministic object spawner and counts
- Object identity and index tracking

Why this matters:
- The engine becomes a reusable content platform instead of a static demo.
- It supports live addition/removal without hidden coupling.

Exit criteria:
- New objects can be added by subclass + registration.
- Existing objects keep stable indices when counts change.
- Total counts respect cap and layout constraints.

### Slice 4 — Interaction and selection
Goal: deliver a usable inspection and editing loop.

Deliverables:
- Raycasting against primitives
- Hover and selection state machine
- Reticle and outline feedback
- Info panel showing selected object identity
- Select/deselect behavior on object and empty space

Why this matters:
- This is the user-visible interaction setting for the entire app.
- It defines how the user navigates and targets content in the scene.

Exit criteria:
- Hover and select work consistently across mouse and touch.
- Only the nearest valid hit is selected.
- The info panel shows useful object information without coupling to one specific type.

### Slice 5 — Control pane and persistence
Goal: make the app controllable and stateful.

Deliverables:
- Left docked control pane with collapsible sections
- Live controls for view, movement, objects, and debug
- Schema-driven settings model
- localStorage persistence with validation and defaults
- Reset behavior and safe storage failure handling

Why this matters:
- Persistence is a core product requirement.
- The schema-driven approach reduces maintenance and enables growth.

Exit criteria:
- Every setting reloads cleanly without visible jump.
- Corrupt or missing data falls back gracefully.
- Any new schema entry automatically appears in the pane.

### Slice 6 — Texture and UV authoring workflow
Goal: deliver the visual editing layer that makes the project feel like a creative tool.

Deliverables:
- UV template generation from actual mesh UVs
- Texture box in the info panel
- Download, upload, reset, and apply to all-of-type logic
- IndexedDB persistence for uploaded textures
- Shared GPU texture management and per-instance overrides

Why this matters:
- This is the differentiator beyond simple 3D navigation.
- It turns the engine into a content-design tool.

Exit criteria:
- UV template aligns exactly with the mesh edges.
- Uploaded textures apply correctly after reload.
- Type-wide and instance-wide texture scope work as designed.

### Slice 7 — Mobile and performance
Goal: make the system usable on smaller screens and optimized hardware.

Deliverables:
- Mobile controls and layout behavior
- Touch-friendly pane drawer
- Joystick + look drag interaction
- Pixel density cap and performance-aware rendering
- Debug overlay for FPS and frame metrics

Why this matters:
- The spec explicitly targets desktop and mobile browsers.
- It keeps the project credible for real-world testing.

Exit criteria:
- Touch interaction remains reliable and non-blocking.
- 60 FPS remains viable on target devices.
- Performance stays stable at the object cap.

### Slice 8 — Polish, debugging, and release readiness
Goal: remove rough edges before formal launch.

Deliverables:
- Debug overlay tuning
- Resize/orientation handling
- Cross-tab and storage event behavior
- DECISIONS.md assumptions log
- Final QA pass against acceptance criteria

Why last:
- It closes the loop after all systems are in place.
- It reduces late-stage churn.

Exit criteria:
- Acceptance criteria pass.
- Known assumptions are documented.
- The app has a clear path to future expansion.

## 6. Sequencing strategy

The safest sequencing is strict and incremental:

1. Foundation
2. Movement
3. Scene objects
4. Interaction
5. Settings/persistence
6. Texture workflow
7. Mobile support
8. Polish

This order reduces the chance of building a feature-rich system on a broken core. Each stage can be tested in the browser immediately and kept working as the project grows.

## 7. Scope boundaries

### Included in v1
- First-person navigation
- Four primitive object types
- Selection and hover
- Object spawning and count controls
- Settings schema + persistence
- UV template and texture upload workflow
- Mobile input basics
- Debug mode

### Out of scope for v1
- Large imported 3D scene libraries
- Multi-room or large-world streaming
- Advanced physics or animation systems
- User accounts or cloud storage
- Full content publishing pipeline
- Complex procedural generation beyond deterministic object layouts

## 8. Risk management

### Main technical risks
- Camera math and collision bugs causing jank or clipping
- UV/texture system becoming too fragile or inconsistent with mesh layouts
- Performance degradation as object count grows
- Mobile input behavior conflicting with browser gestures

### Mitigation approach
- Validate movement math early with simple, explicit tests.
- Keep architecture modular and single-responsibility.
- Use deterministic placement and broad-phase collision logic.
- Treat mobile and texture systems as separate slices with their own acceptance tests.

## 9. Recommended execution model

Use a phased build with browser validation after each slice. The team should not jump ahead to texture or mobile work until the current slice is stable. This keeps the project transparent, testable, and easier to reason about as the codebase grows.

## 10. Success definition

The project is successful when:
- the user can walk and inspect a 3D scene naturally,
- objects can be selected and identified clearly,
- settings persist across reloads without issues,
- primitive UV textures can be edited and reapplied,
- the app runs acceptably on desktop and mobile,
- the architecture is ready for future gallery or content-driven expansion.

## 11. Recommended next step

Start with Slice 1 and build only the engine shell, camera math, floor, and settings schema. This creates the technical spine for the rest of the project and gives an immediate working foundation for the next slices.
