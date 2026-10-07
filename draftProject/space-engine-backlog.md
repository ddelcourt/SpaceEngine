# Space Engine execution backlog

## 1. Objective

Build the project in strict, testable phases. The primary goal is to avoid building a large interactive system on an unstable core. Every phase should be browser-validated before moving to the next one.

The project should be implemented as a static, no-build-step p5.js app with a modular architecture, with each class kept in its own file and a single engine instance.

## 2. Project principles

- Ship the smallest useful version of each system before expanding it.
- Validate in-browser after every phase.
- Prefer simplicity that remains extensible.
- Keep settings schema-driven from the start.
- Treat movement, collision, and selection as the critical path.
- Do not move to UV/texture work until the 3D camera and interaction loop are stable.

## 3. Delivery strategy

Work in the following phases, in this exact order:

1. Foundation
2. Movement and navigation
3. Objects and scene generation
4. Interaction and selection
5. Settings and persistence
6. Texture and UV workflow
7. Mobile support
8. Polish and QA

## 4. Phase-by-phase backlog

### Phase 1 — Foundation

Goal: set up the runtime shell and the technical baseline.

Tasks:
- 1.1 Create the static project structure and browser entry point.
- 1.2 Build the `Engine` loop and lifecycle wiring.
- 1.3 Implement `Clock` for delta time, clamp logic, and FPS measurement.
- 1.4 Define the `Settings` schema and the single source of truth pattern.
- 1.5 Implement `SettingsStore` with localStorage persistence structure and validation hooks.
- 1.6 Create `CameraMath` with yaw/pitch conventions and vector helpers.
- 1.7 Build `CameraRig` with projection, aspect ratio, and camera transform.
- 1.8 Create the floor renderer and build once only.
- 1.9 Add ambient + directional lighting.
- 1.10 Add debug scaffolding for the overlay shell.

Dependencies:
- None. This is the foundation phase.

Definition of done:
- The app boots in the browser without console errors.
- The scene renders in WEBGL with the correct floor and lighting.
- The camera math matches the required conventions.
- The settings schema exists and can be read from the runtime.
- The engine loop produces a stable frame cycle.

Acceptance checks:
- Yaw 0: W moves toward -Z, D toward +X.
- Ingredient conventions are consistent across code.
- p5 and local setup are working offline with pinned vendored assets.

Gate to next phase:
- Do not proceed until camera math and scene rendering are stable.

---

### Phase 2 — Movement and navigation

Goal: make the player feel natural and safe in the space.

Tasks:
- 2.1 Build `InputManager` and convert raw input into one intent object.
- 2.2 Implement desktop keyboard + mouse input and pointer lock behavior.
- 2.3 Implement the player state object (`Player`) with position, yaw, pitch, and radius.
- 2.4 Apply movement using `deltaTime` and normalized input vectors.
- 2.5 Add anti-tunneling step splitting when movement exceeds safe distance.
- 2.6 Add collision boundary clamp to the 100x100 floor.
- 2.7 Implement basic object collision checks using circle and AABB logic.
- 2.8 Add sliding resolution and multiple-pass collision handling.
- 2.9 Add `Esc` unlock behavior and “Click to start” overlay when pointer is not locked.
- 2.10 Add debug overlay values for position, yaw, pitch, and dt.

Dependencies:
- Phase 1 must be completed.

Definition of done:
- Movement speed feels consistent at 60Hz and 144Hz.
- Diagonal movement is not faster than straight movement.
- The player cannot leave the floor bounds.
- The player slides around obstacles without sticking.
- Pointer lock and desktop input work correctly.

Acceptance checks:
- W and D movement match expected directions.
- Mouse right movement turns the view right.
- Diagonal movement remains normalized.
- Collision against object edges and corners is stable.

Gate to next phase:
- Only proceed when movement and collision are smooth and repeatable.

---

### Phase 3 — Objects and scene generation

Goal: add the scene content layer and make object creation extensible.

Tasks:
- 3.1 Define the `SceneObject` base class and shared state model.
- 3.2 Implement the four primitive object classes: Cube, Pyramid, Cone, Sphere.
- 3.3 Build `MeshBuilder` and generate custom UV-capable meshes for each primitive.
- 3.4 Add mesh sharing and instance transforms without one-copy-per-object duplication.
- 3.5 Create the world container and object registry.
- 3.6 Implement `ObjectSpawner` using deterministic placement rules.
- 3.7 Add object count sliders and total cap logic in settings.
- 3.8 Ensure object indices remain stable while the object set changes.
- 3.9 Add removal logic for deselected or deleted objects.
- 3.10 Add object-level debug counters for counts and frame stats.

Dependencies:
- Phase 2 must be complete.

Definition of done:
- The world contains multiple objects with valid transforms.
- Each object has stable identity and per-type index.
- Object counts can be increased or reduced live.
- The scene remains navigable while objects are added or removed.

Acceptance checks:
- Count sliders work live, with correct caps and limits.
- Objects never overlap the spawn point or each other in placement.
- Existing objects keep position and index when counts change.
- The spawner stops gracefully when placement fails.

Gate to next phase:
- Proceed only when object creation/removal is clean and deterministic.

---

### Phase 4 — Interaction and selection

Goal: turn the scene into a usable inspection environment.

Tasks:
- 4.1 Implement raycasting from the camera origin into world objects.
- 4.2 Add geometry-specific ray hit logic: sphere, cube, pyramid, cone.
- 4.3 Create `SelectionManager` with IDLE, HOVER, SELECTED states.
- 4.4 Add reticle logic and hover visual feedback.
- 4.5 Add wireframe outline pass for the hovered object.
- 4.6 Implement object selection and deselection behavior.
- 4.7 Add `InfoPanel` content from `getInfo()` and object metadata hooks.
- 4.8 Add selection logging and object naming rules.
- 4.9 Add selected glow / hover color handling without breaking object textures.
- 4.10 Ensure selection remains consistent across mouse + keyboard and touch input.

Dependencies:
- Phase 3 must be complete.

Definition of done:
- Hover works reliably on interactive objects.
- Selecting an object shows clear info in the panel.
- Empty-space select deselects correctly.
- The nearest hit is chosen among multiple object intersections.

Acceptance checks:
- Reticle turns green when hovering a valid target.
- Info panel shows primitive name and index.
- Selection state remains correct after object removal.

Gate to next phase:
- Only proceed when raycast and selection are deterministic and visually clean.

---

### Phase 5 — Settings and persistence

Goal: make the engine configurable and stateful.

Tasks:
- 5.1 Build the schema-driven settings model and runtime subscription hooks.
- 5.2 Connect the control pane to schema entries and generate widgets automatically.
- 5.3 Add sections: View, Movement, Objects, Debug.
- 5.4 Add live value updates and clamping.
- 5.5 Implement localStorage saving with debouncing and pagehide/visibility handlers.
- 5.6 Implement validation, fallback defaults, and corruption handling.
- 5.7 Ensure unknown keys are dropped and bad values are replaced.
- 5.8 Add Reset to defaults across the full schema.
- 5.9 Add warning logic for near-plane settings that violate safe ranges.
- 5.10 Add storage failure notice and safe in-memory fallback behavior.
- 5.11 Add cross-tab handling or documented decision with `DECISIONS.md`.

Dependencies:
- Phases 1-4 must be stable.

Definition of done:
- The scene reloads with saved state without a visible jump.
- Every schema key persists and restores correctly.
- Corrupt or missing data never breaks runtime behavior.
- New schema entries appear automatically in the pane and storage.

Acceptance checks:
- Every setting is restored after reload.
- Unknown stored keys are ignored safely.
- Storage quota/private mode failures do not crash the app.

Gate to next phase:
- Only proceed when persistence is robust and fully schema-driven.

---

### Phase 6 — Texture and UV workflow

Goal: make the scene editable and visually customizable.

Tasks:
- 6.1 Generate UV layouts from each mesh’s actual UVs.
- 6.2 Build template-generation logic for guides and blank templates.
- 6.3 Build the info-panel texture box and preview area.
- 6.4 Add Download template, Upload texture, Reset, and apply-to-all controls.
- 6.5 Implement image upload validation and safe downscaling.
- 6.6 Add texture mode and mapping logic for each primitive mesh.
- 6.7 Implement texture scope: per-instance or per-type.
- 6.8 Add IndexedDB store for texture persistence using type and instance keys.
- 6.9 Add texture restore at startup before object spawner or as soon as decoding completes.
- 6.10 Add clear-all-textures control and storage failure messaging.
- 6.11 Validate UV alignment and V-axis orientation with guide lines.

Dependencies:
- Phases 1-5 must be complete.

Definition of done:
- The selected object displays a UV template in the panel.
- Uploaded textures apply to the correct object type or instance.
- Reset restores the default appearance in the correct scope.
- Persisted textures survive reloads.

Acceptance checks:
- Downloaded guide template matches mesh edges after upload.
- Uploaded textures appear without flipped or shifted UVs.
- Reapplying texture after reload works correctly.

Gate to next phase:
- Only proceed when texture workflows are consistent and persist correctly.

---

### Phase 7 — Mobile support

Goal: ensure the app works on touch-first devices without sacrificing desktop quality.

Tasks:
- 7.1 Add touch detection and hybrid input support.
- 7.2 Build virtual joystick for movement.
- 7.3 Add right-side drag look interaction.
- 7.4 Add short-tap select behavior for touch devices.
- 7.5 Prevent page scrolling / pinch zoom on the canvas.
- 7.6 Add mobile layout logic for the control pane drawer.
- 7.7 Make the info panel usable as a bottom sheet on mobile.
- 7.8 Add pixel density capping for touch devices.
- 7.9 Verify transform and layout behavior on resize/orientation change.
- 7.10 Ensure all interactions remain consistent with desktop mode.

Dependencies:
- Phases 1-6 must be complete.

Definition of done:
- Touch movement, look, and selection work without browser interference.
- The pane does not block joystick or look zone when closed.
- The app remains responsive on mobile and keeps acceptable performance.

Acceptance checks:
- Joystick and drag-to-look both work reliably.
- Short taps select the object under the reticle.
- UI remains legible and usable after orientation changes.

Gate to next phase:
- Proceed only when touch behavior is stable and not regressing desktop.

---

### Phase 8 — Polish and QA

Goal: finish the project to release quality and validate against the spec.

Tasks:
- 8.1 Run the full acceptance checklist against the spec.
- 8.2 Tune performance and object caps for desktop and mobile.
- 8.3 Verify far-distance grid fade and no visible banding.
- 8.4 Review debug overlays and remove unnecessary noise.
- 8.5 Improve resize and orientation handling.
- 8.6 Add `DECISIONS.md` with any assumptions and trade-offs.
- 8.7 Validate no hidden global state remains.
- 8.8 Confirm p5 version pinning and vendor dependencies are local and offline-safe.
- 8.9 Check memory/performance of texture storage and object counts.
- 8.10 Final browser test on desktop + mobile representative devices.

Dependencies:
- Phases 1-7 must be complete.

Definition of done:
- The app matches the major acceptance criteria.
- It is stable under runtime changes, reloads, and object count changes.
- The code is structured for future extension without rework.

Acceptance checks:
- 60 FPS is credible on target hardware.
- All settings persist correctly.
- The app passes the major quality and UX requirements from the draft.

---

## 5. Recommended execution cadence

Use this rhythm for each phase:

1. Build the phase in a small slice of code.
2. Run the sketch in the browser.
3. Verify the acceptance checks for that phase.
4. Fix issues before moving on.
5. Record any implementation decision in `DECISIONS.md`.
6. Move to the next phase only after validation.

This is the most important decision for reducing project risk.

## 6. High-risk areas to watch closely

- Player movement math and collision resolution
- Raycasting and selection correctness
- Settings schema drift and persistence failures
- UV orientation and texture alignment
- Mobile input conflicts with browser gestures
- Performance under maximum object counts

## 7. Suggested first milestone

The first milestone should be:

- Engine shell
- Clock
- Settings schema
- Camera math
- Floor and lighting
- Basic movement loop

This milestone is enough to prove the project is viable before spending time on textures, UI polish, or mobile improvements.

## 8. Final recommendation

Use the strict phase order above and do not stack work beyond the current phase. This is the safest and most intelligent execution path for a project like this because it turns a risky, broad feature set into a controlled sequence of working milestones.
