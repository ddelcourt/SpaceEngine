# p5.js 3D First-Person Space Engine: Specification v5

**Audience:** Claude Code (implementing agent)
**Goal:** A modular, object-oriented 3D first-person navigation and interaction engine in p5.js. The 4-primitive scene is a proof of concept. The architecture must be the seed of a larger gallery-type application.
**Targets:** Desktop and mobile browsers, 60 fps, no build step.

---

## 0. How to work

Act as a Senior Creative Technologist and Software Engineer specialising in WebGL and p5.js.

1. Build in the phases listed in section 13, and run the sketch after each phase.
2. Keep every class in its own file. No global state besides the p5 lifecycle functions and one `engine` instance.
3. Comment the code, especially anything involving coordinate conventions.
4. When a requirement is ambiguous, pick the simplest option that keeps the architecture extensible, and note the decision in a `DECISIONS.md`.
5. **Dependencies:** p5.js plus small helper libraries are acceptable (for example `nipplejs` for the virtual joystick). Pin exact versions and vendor local copies in `/lib` so the project runs offline with no build step.

---

## 1. Base metrics and conventions

| Item | Value |
| :--- | :--- |
| Base unit | `UNIT = 1.0` (all dimensions below are in U) |
| Floor | 100U x 100U on the XZ plane, Y = 0, centred on the origin |
| Axis convention | p5 WebGL: **+Y is down, -Y is up**, -Z is "forward" at yaw 0 |
| Eye height | Y = -1.8U |
| Movement speed | **9.0 U/s** (equivalent to 0.15U/frame at 60 fps), configurable |
| Player collision radius | `R_p = 0.5U` |
| Pitch limits | -89 to +89 degrees |

### Camera maths (state this once, use everywhere)

Define in a single `CameraMath` helper and reuse it for movement, rendering and raycasting:

- Yaw 0 faces -Z. Positive yaw turns right (clockwise seen from above).
- Positive pitch looks **up**.
- Forward (with pitch): `(sin(yaw)·cos(pitch), -sin(pitch), -cos(yaw)·cos(pitch))`
- Horizontal forward (for W/S): `(sin(yaw), 0, -cos(yaw))`
- Right (for A/D): `(cos(yaw), 0, sin(yaw))`

Verify with a quick test: at yaw 0, W must move toward -Z, D toward +X, and moving the mouse right must turn the view right.

### Object anchoring

Every `SceneObject` is positioned by its **base centre on the floor** (Y = 0 means resting on the ground). The renderer applies the half-height offset internally. This removes the "centre vs. base" confusion in the original table, and means future objects of any height just work.

---

## 2. Delta-time and update loop

- Movement uses `deltaTime` (seconds): `position += direction · speed · dt`.
- Clamp `dt` to a maximum of 50 ms so tab switches or hitches never teleport the player.
- **Normalise the input vector**, so diagonal movement (W+D) is not about 41% faster.
- **Anti-tunnelling:** if `speed · dt > R_p / 2`, split the step into sub-steps.
- Order per frame: `Input -> Player.update(dt) -> CollisionSystem.resolve -> Raycaster.update -> Render -> HUD`.

---

## 3. Class architecture

```
index.html
/src
  Engine.js              owns the loop and wires everything together
  Settings.js            schema + observable values: single source of truth for every parameter
  Clock.js               deltaTime, clamping, fps measurement
  CameraMath.js          direction vectors, conversions
  CameraRig.js           applies position, yaw, pitch, FOV, near/far, aspect to p5
  Player.js              position, velocity, yaw, pitch, radius
  /storage
    SettingsStore.js     localStorage load/save/migrate for the whole settings schema
    TextureStore.js      IndexedDB persistence for uploaded textures
  /input
    InputManager.js      aggregates all input sources into one intent object
    KeyboardMouseInput.js  WASD, pointer lock, click, E
    TouchInput.js        virtual joystick, look-drag, tap-to-select
  /world
    World.js             scene container: floor, lights, list of SceneObjects
    Floor.js             grid, built once
    SceneObject.js       base class (see section 6)
    Cube.js  Pyramid.js  Cone.js  Sphere.js
    MeshBuilder.js       builds shared meshes with our own UV unwrap
    ObjectSpawner.js     reconciles object counts, deterministic layout
    TextureManager.js    UV templates, uploaded textures, GPU texture sharing
  /physics
    Collider.js          base class
    CircleCollider.js    XZ circle
    AABBCollider.js      XZ axis-aligned box
    CollisionSystem.js   resolution and sliding
    SpatialGrid.js       XZ broad-phase for many objects
  /interaction
    Raycaster.js         ray vs. objects
    SelectionManager.js  hover and selected state
  /ui
    ControlPane.js       left-side settings pane (HTML/DOM)
    InfoPanel.js         name and index of the selected object
    TexturePanel.js      UV template box: download, upload, reset
    Reticle.js           crosshair
    DebugOverlay.js      collider circles, ray, fps, counters
```

Rules:

- `Engine` is the only class that knows about all the others.
- Systems receive their dependencies through constructors (no hidden globals).
- `Settings` is defined by a **schema** (section 5) and is observable: the `ControlPane` writes to it, the `SettingsStore` persists it, and the `CameraRig`, `Player` and `Engine` read from it or subscribe to changes.

---

## 4. Rendering and environment

- **Canvas:** p5 `WEBGL`, sized to the scene area (see section 5).
- **Floor:** 100 x 100 grid lines every 1.0U, stroke `#333333` on background `#111111`. Build the grid **once** as a reusable `p5.Geometry` (or a single `beginShape(LINES)` cached in a buffer) rather than issuing 200 line calls per frame. Pin a p5 version and confirm which geometry-building API it offers.
- **Lights:** ambient `(50, 50, 50)`; directional `(220, 220, 220)` along `(-1, -1, -0.5)`.
- **Mobile performance:** cap `pixelDensity` at 1.5 on touch devices (configurable), and avoid per-frame allocations (reuse vectors).
- **Distance fade (required):** grid lines fade out with distance from the camera so the far floor does not look noisy. Implement with a small custom shader (preferred) or per-vertex colour updates, blending the line colour toward the background `#111111`. Fade is controlled by one `gridFadeDistance` setting (default 50U): fully visible up to 40% of that distance, fully faded at 100% of it. Keep it a single draw call.

---

## 5. Control pane and canvas/scene ratio

A collapsible **pane docked on the left** of the window. It is a DOM overlay, not drawn in WebGL. The 3D scene occupies the remaining area.

| Control | Type | Range / options | Default |
| :--- | :--- | :--- | :--- |
| Canvas/scene ratio | select | Fill, 16:9, 4:3, 1:1, 21:9 | Fill |
| Camera FOV | slider | 30 to 110 degrees | 75 |
| Near plane | slider | 0.01U to 1.0U | 0.05U |
| Far plane | slider | 100U to 1000U | 500U |
| Grid fade distance | slider | 10U to 100U | 50U |
| Cubes | slider | 0 to 25 | 1 |
| Pyramids | slider | 0 to 25 | 1 |
| Cones | slider | 0 to 25 | 1 |
| Spheres | slider | 0 to 25 | 1 |
| Movement speed | slider | 1 to 20 U/s | 9 |
| Mouse / look sensitivity | slider | 0.1x to 3x | 1x |
| Debug mode | toggle | on / off | off |

Behaviour:

- **Ratio:** the scene is letterboxed inside the available area at the chosen aspect ratio. "Fill" uses all available space. The reticle sits at the centre of the **scene canvas**, not the window. The camera aspect always matches the canvas.
- **Near plane clipping must be avoided.** Defaults: near = 0.05U, and the player radius (0.5U) is always at least 10x the near distance. If the user sets a near value that makes this untrue, show a warning in the pane. Keep far/near sensible (very small near with a very large far hurts depth precision), and document the trade-off in a tooltip.
- Group the controls into collapsible sections: **View**, **Movement**, **Objects**, **Debug**.
- Changes apply live. The object-count sliders are explained in section 14.
- **Persistence (required):** every setting in this pane is persisted. See "Persistence of every setting" below.
- **Pointer lock interplay:** the pane cannot be used while the pointer is locked. Pressing `Esc` releases the lock and the pane becomes usable. Clicking the scene re-locks it.
- **Mobile:** the pane collapses into a drawer opened by a button, and does not cover the joystick or look area when closed.

### Persistence of every setting

**Rule: every option and parameter is wired to local storage, with no exceptions.** To make that automatic rather than a checklist, the settings are defined **once, in a schema**, and everything else is generated from it.

- **Schema:** each setting is declared in `Settings.js` with a stable key, type, default, and (where relevant) min, max, step and options. The control pane builds its widgets from the schema, and `SettingsStore` persists whatever the schema contains. Adding a parameter therefore means adding one schema entry, and it is saved, restored, clamped and reset with no other code.
- **Persisted settings (initial list):**

| Key | Meaning |
| :--- | :--- |
| `view.aspectRatio` | Canvas/scene ratio |
| `view.fov` | Camera FOV |
| `view.near`, `view.far` | Near and far plane |
| `view.gridFadeDistance` | Grid fade distance |
| `movement.speed` | Movement speed (U/s) |
| `movement.lookSensitivity` | Look sensitivity |
| `objects.count.cube`, `.pyramid`, `.cone`, `.sphere` | Object counts |
| `debug.enabled` | Debug mode |
| `ui.paneOpen`, `ui.sectionsOpen` | Pane and section collapsed state |
| `ui.showUvGuides`, `ui.applyToAll` | Texture box toggles |

- **Storage:** one JSON object under one versioned key, `spaceEngine.settings.v1`, containing `{ version, values }`.
- **Saving:** write on every change, debounced (about 300 ms), plus an immediate flush on `visibilitychange` (hidden) and `pagehide`, so nothing is lost when the tab closes or the phone app is backgrounded.
- **Loading:** read at startup, **before** the first frame and before the spawner runs, so the scene starts directly in the saved state with no visible jump.
- **Validation:** for each schema key, take the stored value if it has the right type, clamp numbers to min/max, check select values against the allowed options. Drop unknown keys, and use the default for missing or invalid ones. Corrupt JSON falls back to all defaults without throwing.
- **Migration:** if the stored `version` is older, run a migration function (it may be a no-op for now). Never discard the user's values just because the version changed.
- **Unavailable storage:** wrap every access in try/catch (private mode, quota exceeded, blocked by the browser). The engine keeps working with in-memory settings and shows one small non-blocking notice in the pane ("Settings can't be saved in this browser").
- **Cross-tab:** listen to the `storage` event and apply external changes live, or ignore them (pick the simpler option and note it in `DECISIONS.md`).
- **Reset:** "Reset to defaults" restores every schema default and rewrites storage. It does not delete uploaded textures (see section 15.6), which have their own "Clear all textures" button in the Objects section.
- **Not persisted by default:** the player's position and view direction (the player always starts at the spawn point).

---

## 6. Scene objects and extensibility

All objects extend `SceneObject`:

```
SceneObject
  id, type, index, name               // e.g. id "cube-3", shown as "Cube #3" in the info panel
  texture                             // optional per-instance texture override (section 15)
  metadata                            // open object, unused for now, reserved for future content (description, media, links)
  position (base centre), rotationY, scale
  fill, state                         // IDLE | HOVER | SELECTED  (reserve DRAGGING)
  collider                            // Circle or AABB, in XZ
  render(p5, quality)                 // draws geometry + state feedback
  raycast(origin, dir, maxDist)       // returns {hit, distance, point} or null
  getBounds()                         // for broad-phase checks and debug drawing
  onHover(), onUnhover(), onSelect(), onDeselect()   // overridable hooks
  setPosition(x, z)                   // used later for moving objects
```

Concrete objects, using the original dimensions and anchoring on the floor:

| Class | Dimensions | Base-centre position (X, Z) | Fill | Collider |
| :--- | :--- | :--- | :--- | :--- |
| `Cube` | 2U x 2U x 2U | (-5, -10) | Coral Red | AABB 2x2 |
| `Pyramid` | base 2U, height 3U | (5, -10) | Goldenrod | AABB 2x2 |
| `Cone` | radius 1U, height 3U | (-5, -20) | Teal Blue | Circle r = 1 |
| `Sphere` | radius 1.5U | (5, -20) | Purple | Circle r = 1.5 |

The positions above are for the **first instance (index 0)** of each type. Additional instances come from the spawner (section 14).

p5 notes for the implementer:

- p5 has no pyramid primitive. Build a custom 4-sided pyramid mesh (4 triangles + base).
- Check the default orientation of `cone()` and rotate it so the **tip points up (-Y)**.
- Every object must render correctly when its centre offset is applied internally from its height.

Adding a new object type (for example, a loaded OBJ model or a text label) should only require a new subclass and one line in `World`. No changes to the collision, raycast or selection systems.

---

## 7. Input

`InputManager` outputs one **intent** object per frame so the rest of the engine does not care where input came from:

```
{ moveX, moveZ,        // -1..1 (strafe, forward)
  lookDX, lookDY,      // relative look delta
  select }             // true on the frame a selection is requested
```

### Desktop (KeyboardMouseInput)

- Click on the scene requests pointer lock. **That first click must not also select.**
- While locked: mouse movement gives look deltas; `W A S D` give movement; left click or `E` selects.
- `Esc` unlocks. Show a "Click to start" overlay whenever the pointer is not locked.

### Mobile / touch (TouchInput)

- Virtual joystick in the lower left for movement.
- Drag anywhere on the right half of the screen to look.
- Tap (a short touch with little movement) selects the object under the reticle.
- Use pointer/touch events with `touch-action: none` on the canvas to prevent page scrolling and zooming. Pointer lock is not used on touch devices.
- Auto-detect touch capability, and allow both input modes to coexist (hybrid devices).

---

## 8. Collision engine (2.5D)

- Player: circle on the XZ plane, radius 0.5U.
- Outer boundary: clamp `(X, Z)` to `[-49.5U, +49.5U]`.
- Obstacle checks: **circle vs. circle** and **circle vs. AABB** (closest point on the box to the player centre).
- **Sliding (smooth):**
  1. Move the player by the full intended step.
  2. For each overlapping collider, compute the contact normal `n` (centre-to-centre for circles, closest-point-to-centre for AABBs) and the penetration depth.
  3. Push the player out along `n` by the penetration depth.
  4. Remove the velocity component into the surface (`v -= (v·n)·n`), so the remaining motion slides along the tangent.
  5. Iterate up to 3 passes to handle corners and multiple obstacles, then re-clamp to the outer boundary.
- Handle the degenerate case where the player centre is inside an AABB (push out along the axis of least penetration).
- The collision system works on the generic `Collider` interface, so new objects need no changes here.

---

## 9. Raycasting and selection

- Ray origin: camera position. Direction: full 3D forward vector (including pitch). Max distance: **15.0U**.
- Each `SceneObject.raycast` implements its own test:
  - `Sphere`: analytic ray-sphere.
  - `Cube`: ray-AABB (slab method).
  - `Pyramid`, `Cone`: broad-phase AABB, then Moller-Trumbore against the mesh triangles (so hits match the visible shape rather than a loose bounding volume).
- `Raycaster` picks the **nearest** hit among all objects within range.
- `SelectionManager` state machine: `IDLE -> HOVER` (reticle on object in range) `-> SELECTED` (select intent).
  - Single-select: selecting a new object deselects the previous one.
  - Selecting the already selected object, or selecting empty space, deselects.
- Feedback:
  - Reticle: white by default, active green when hovering a valid target.
  - Hover: a **wireframe outline** pass drawn over the hovered object (slightly scaled or with depth offset so it does not z-fight). No brightness tint.
  - Selected: glowing look via `emissiveMaterial()` (or a small custom shader, if the implementer prefers).
  - Log the object ID to the console on selection.
- **Info panel:** on selection, `InfoPanel` shows the object's **primitive name** and its **per-type index** (for example "Cube #3"), plus the **texture box** described in section 15. It is an HTML overlay on the right side of the scene, or a bottom sheet on mobile, and hides on deselection. The text part renders from a small `getInfo()` method on `SceneObject`, so richer content can be added later without touching the panel's plumbing.
- **Future-proofing for moving objects:** keep `SELECTED` separate from a reserved `DRAGGING` state, and keep `setPosition` on `SceneObject` going through the collision system. No dragging is implemented in this version.

---

## 10. Debug mode

A toggle in the control pane. When on:

- Draw collider shapes (player circle, object circles/AABBs) as flat outlines on the floor.
- Draw the raycast line and the hit point.
- Show an overlay with: fps, frame time (ms), `dt`, player position, yaw/pitch, current hover and selected IDs.
- Log collision events sparingly (no per-frame console spam).

Debug drawing must have zero cost when switched off.

---

## 11. Window and device handling

- Handle window resize and orientation change: recompute canvas size, aspect ratio and camera projection.
- Pause the loop (or at least input) when the tab is hidden, and reset the clock when it returns.
- Release the movement keys on window blur so the player does not keep walking.

---

## 12. Acceptance criteria

1. Constant 60 fps on a mid-range laptop and a recent phone, with the debug overlay confirming it.
2. Movement speed feels the same at 60 Hz and 144 Hz.
3. Diagonal movement is not faster than straight movement.
4. The player cannot enter any object or leave the grid, and slides smoothly along surfaces and around corners without sticking.
5. No visible geometry clipping when walking up to an object at the default near plane.
6. Hover and select work identically with mouse/keyboard and touch.
7. FOV, ratio, near plane, speed and debug toggles in the control pane take effect live.
8. Adding a fifth object requires only a new subclass and one registration line.
9. Far grid lines fade smoothly into the background with no visible banding, and the fade distance responds live to the pane slider.
10. Reloading the page restores **every** setting in the schema (view, movement, counts, debug, pane state, texture box toggles), and the scene starts in that state without a visible jump. Corrupt, missing or out-of-range stored data falls back to defaults without errors.
11. The hovered object shows a clean wireframe outline without flicker, and the info panel shows its name and index when selected.
12. Moving a count slider adds or removes objects live, never overlapping each other or the player spawn, and existing objects keep their position and index.
13. 60 fps holds at the object cap on desktop and mobile (check with the debug overlay).
14. Selecting an object shows its 2D UV layout. Downloading it, uploading it back unchanged, and viewing the object shows the guide lines aligned exactly with the mesh edges (no flipped or shifted UVs).
15. An edited texture appears on the selected object (or on all objects of that type when the checkbox is set), and "Reset" restores the default look.
16. Uploaded textures are still applied to the right objects after a reload, and storage failures (quota, private mode) never break the app.
17. Adding a new entry to the settings schema is enough for it to appear in the pane, persist, clamp, and reset (verify by adding a dummy setting).

---

## 13. Build phases

1. **Foundation:** `Engine`, `Clock`, `Settings` (schema) with `SettingsStore`, `CameraMath`, `CameraRig`, floor with distance fade, lights.
2. **Movement:** `Player`, desktop input with pointer lock, delta-time movement, verified conventions.
3. **Objects:** `SceneObject`, `MeshBuilder` (with UVs) and the four primitives.
4. **Collision:** colliders, boundary clamp and sliding.
5. **Interaction:** raycaster, selection states, reticle, info panel.
6. **Control pane, object-count sliders with `ObjectSpawner`, settings persistence and debug mode.**
7. **Texture workflow:** UV template generation, texture box, upload and apply, `TextureStore` persistence.
8. **Touch input and mobile layout.**
9. **Polish:** performance pass, resize handling, `DECISIONS.md`.

---

## 14. Object counts and spawning

- **Sliders:** the control pane has one slider per primitive type (Cubes, Pyramids, Cones, Spheres), 0 to 25 each, default 1 each (the original proof-of-concept scene). Show the current value next to each slider.
- **Total cap:** a constant `MAX_OBJECTS` (default 60 on desktop, 40 on touch devices). The pane shows "Total: N / cap", and a slider cannot push the total past the cap (it clamps and shows a short note).
- **Persistence:** counts are saved and restored with the other pane settings (section 5).
- **Spawner:** `ObjectSpawner` reconciles the world to the requested counts. Increasing a count adds instances without moving existing ones. Decreasing removes the instances with the highest index first.
- **Placement:** the first instance of each type uses the fixed position from section 6. Additional instances use a **deterministic** layout (seeded random with a fixed seed, so the scene is reproducible) based on rejection sampling:
  - inside the floor bounds with a 3U margin from the edge,
  - at least 3U from the player spawn,
  - at least 1.5U of free gap between collider edges, so the player can always walk between objects.
  If no free spot is found after a fixed number of attempts, stop spawning and show a note in the pane.
- **Identity:** every object has a `type`, a **per-type index** (0-based, stable while the object exists) and an id such as `cube-3`. The info panel shows "Cube #3". The id is what gets logged to the console on selection.
- **Selection and removal:** if the selected object is removed, deselect it, hide the info panel and clear hover state.
- **Scaling to many objects:**
  - Collision uses a uniform spatial grid on the XZ plane (cell size about 4U) as a broad phase, so only nearby colliders are tested.
  - Raycasting rejects with a cheap sphere/AABB test before any triangle test, and stops at the nearest hit.
  - Meshes are built **once per type** and shared. An instance holds only its transform, state and optional texture reference.
- **Debug overlay:** add the object count per type and the number of objects tested by collision and raycast per frame.

---

## 15. Texture box and UV workflow

**Interpretation:** when an object is selected, the info panel opens with a texture box showing the 2D UV layout ("mesh warp") of that primitive type. The user can download it, edit it in an external tool, upload the result, and see it on the 3D object.

### 15.1 Meshes with controlled UVs

- Build all four meshes in `MeshBuilder` as `p5.Geometry` (vertices, faces, normals, **uvs**), with our own unwrap. Do not rely on p5's built-in `box()`, `cone()` and `sphere()` UVs (their layout is not under our control, and for example a cube may reuse the full image on every face). Check this, and keep custom meshes if there is any doubt.
- Unwraps, all inside the 0 to 1 UV square, with islands not overlapping and at least 2% padding between islands to avoid colour bleeding:
  - **Cube:** cross net, 4 x 3 grid with 6 square faces.
  - **Pyramid:** square base with 4 triangular faces attached to its edges (star net).
  - **Cone:** base disc plus the lateral surface unrolled as a circular sector.
  - **Sphere:** equirectangular (longitude/latitude), 2:1 aspect.
- Template size: 1024 px on the long side by default, with the aspect ratio of the unwrap.

### 15.2 Template generation

- `TextureManager` generates the template **from the mesh's actual UVs** (rasterising every triangle edge into an offscreen canvas), not from hand-drawn images. That way any future mesh (for example a loaded OBJ with UVs) gets a template automatically.
- Template look: light grey island fills, thin dark edge lines, and the face name on each island where useful (for example "Front").
- Two downloads, both PNG:
  - **Guides:** edges and labels on a **transparent** background, so an editor can paint underneath.
  - **Blank:** the island shapes filled with the object's default fill colour, as a starting point for painting.

### 15.3 Texture box (UI)

- Placed in the info panel, under the name and index. Fixed preview size (about 256 CSS px on desktop, full panel width on mobile), with a checkerboard background so transparency is visible.
- **Initial state** (on selection, before any upload): the default UV template of the object's type.
- Buttons: **Download template**, **Upload texture**, **Reset**, plus a checkbox **Apply to all [type]s**.
- After an upload the box shows the uploaded image, with a toggle **Show UV guides** overlaying the template lines on it.
- Uploading also works by dragging and dropping a file onto the box (desktop).

### 15.4 Upload and apply

- Accept PNG, JPEG and WebP, with a maximum file size of 10 MB. Reject anything else with an inline error message in the box.
- Decode the file, then downscale so the long edge is at most 2048 px (1024 px on touch devices). Revoke any object URLs after loading.
- Apply with `textureMode(NORMAL)` and `texture()`. A textured object replaces its fill colour, but lighting still applies, and the hover wireframe and the selected glow still work on textured objects.
- Test for orientation: uploading the downloaded "Guides" template unchanged must make its lines line up exactly with the mesh edges. Watch out for a flipped V axis.

### 15.5 Scope and sharing

- By default a texture applies to the **selected instance only**. With **Apply to all [type]s** ticked, it applies to every instance of that type, including instances spawned later.
- `TextureManager` keeps one texture per type plus optional per-instance overrides, and **one GPU texture is shared** by every object using it (never one copy per object).
- **Reset** follows the same scope as the checkbox: it removes the per-instance override, or the per-type texture.
- `SceneObject.setTexture(image)` and a generic `getUVTemplate()` keep this independent of the primitive type, so new object types only need a mesh with UVs.

### 15.6 Persistence of textures

- Uploaded textures persist across reloads. They are **not** stored in `localStorage` (about 5 MB total, and base64 inflates images by about a third, so two or three textures would fill it). `TextureStore` uses **IndexedDB** instead, which is also local, per-browser storage and handles image blobs.
- Database `spaceEngine`, object store `textures`, keyed by `type:<type>` (for example `type:cube`) for per-type textures and `instance:<id>` (for example `instance:cube-3`) for per-instance overrides. Store the already downscaled image as a Blob (PNG or WebP) with its dimensions and a timestamp.
- The settings JSON in `localStorage` does not hold images, only the rest of the state. At startup, `TextureStore` loads all textures **before** the spawner creates objects, or applies them as soon as they decode, with the default fill shown meanwhile.
- A per-instance override is kept even if the count is lowered and later raised again (cube-3 comes back with its texture).
- **Reset** in the texture box deletes that texture from IndexedDB. A **Clear all textures** button in the Objects section deletes everything in the store.
- Failures (quota exceeded, IndexedDB unavailable) keep the texture in memory for the session and show a short inline message in the texture box. Use `navigator.storage.estimate()` where available to warn when space is nearly used up.

### 15.7 Mobile

- Upload works through a standard file input (camera roll or files), and download through a standard anchor download. On mobile the texture box sits in the bottom sheet of the info panel.

---

## 16. Resolved decisions

| Question | Decision |
| :--- | :--- |
| Grid distance fade | Fade out with distance (section 4), adjustable in the pane |
| Info panel content | Primitive name and index only, `metadata` reserved for later (section 9) |
| Hover style | Wireframe outline (section 9) |
| Persistence | **Every** option and parameter is persisted: schema-driven settings in versioned `localStorage` (section 5), textures in IndexedDB (section 15.6) |
| Dependencies | Helper libraries allowed, pinned and vendored locally (section 0) |
| Object counts | One slider per primitive type, 0 to 25, default 1 (section 14) |
| Texture workflow | UV template box in the info panel, download, upload, reset (section 15) |
| Texture scope | Per selected instance by default, with an "apply to all of this type" option |

No open questions remain. Record any new assumptions in `DECISIONS.md`.
