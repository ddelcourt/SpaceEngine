import { Engine } from './Engine.js';

new p5((p) => {
  const engine = new Engine(p);

  p.setup = () => {
    engine.setup();
  };

  p.draw = () => {
    engine.draw();
  };

  p.windowResized = () => {
    engine.resize();
  };

  window.engine = engine;
}, 'app');
