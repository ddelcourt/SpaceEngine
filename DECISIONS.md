# Decisions

- Chosen architecture: static HTML + p5.js in instance mode with ES modules.
- Single engine instance is created from `src/main.js` and exposed on `window.engine` for debugging.
- p5 is vendored locally in `/lib/p5.min.js` at version 1.9.3.
- Settings are schema-driven and loaded from localStorage before first frame render.
- Floor rendering is implemented in WebGL with 3D line segments and distance-based fade using the camera position.
- The project currently implements the foundation stage only; richer systems such as touch input, spawner logic, texture workflow, and full pane UI are intentionally deferred to later slices.
- The movement slice uses simple X/Z sliding collision against object bounds and clamps the player to the 100U floor boundary, with anti-tunneling implemented by splitting large movement steps into sub-steps.
