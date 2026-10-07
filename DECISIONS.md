# Decisions

- Chosen architecture: static HTML + p5.js in instance mode with ES modules.
- Single engine instance is created from `src/main.js` and exposed on `window.engine` for debugging.
- p5 is vendored locally in `/lib/p5.min.js` at version 1.9.3.
- Settings are schema-driven and loaded from localStorage before first frame render.
- Floor rendering is implemented in WebGL with 3D line segments and distance-based fade using the camera position.
- The project currently implements the foundation stage only; richer systems such as touch input, spawner logic, texture workflow, and full pane UI are intentionally deferred to later slices.
- The movement slice uses simple X/Z sliding collision against object bounds and clamps the player to the 100U floor boundary, with anti-tunneling implemented by splitting large movement steps into sub-steps.
- **Cross-tab settings sync:** external `storage` events (another tab writing to the same key) are ignored. The last tab to close wins. This avoids the complexity of live merging and is acceptable for a single-user creative tool where running two sessions simultaneously is unusual. If cross-tab sync becomes a requirement, a `storage` event listener can be added to `SettingsStore.init()` to re-call `load()` and notify the UI.
- **Non-perspective projection (deferred — Phase 9):** FOV values above ~170° are not reachable with p5.js's standard `perspective()` call because `tan(FOV/2)` becomes degenerate at 180°. True fisheye (circular dome, 180°–360°) and equirectangular (full 360°×180° panorama) projections are feasible but require a two-pass approach: render the scene to an offscreen framebuffer at a normal FOV, then warp the result through a custom GLSL fragment shader. The equirectangular variant additionally needs six perspective render passes assembled into a cubemap. Architecture hooks (offscreen `p5.Graphics` buffer, `ProjectionPass.js`, a `projection.mode` settings key) are intentionally deferred to Phase 9 to avoid complexity in the current rendering pipeline. See the Phase 9 entry in `space-engine-backlog.md` for the full task breakdown.
