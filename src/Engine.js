import { Clock } from './Clock.js';
import { Settings } from './Settings.js';
import { SettingsStore } from './SettingsStore.js';
import { CameraRig } from './CameraRig.js';
import { Floor } from './Floor.js';
import { Sky } from './Sky.js';
import { Player } from './Player.js';
import { InputManager } from './input/InputManager.js';
import { KeyboardMouseInput } from './input/KeyboardMouseInput.js';
import { World } from './world/World.js';
import { ObjectSpawner } from './world/ObjectSpawner.js';
import { DropAnimator } from './world/DropAnimator.js';
import { PhysicsWorld } from './physics/PhysicsWorld.js';
import { Raycaster } from './interaction/Raycaster.js';
import { SelectionManager } from './interaction/SelectionManager.js';
import { Reticle } from './ui/Reticle.js';
import { InfoPanel } from './ui/InfoPanel.js';
import { ControlPane } from './ui/ControlPane.js';
import { DebugOverlay } from './ui/DebugOverlay.js';
import { CollisionSystem } from './physics/CollisionSystem.js';

const PANE_WIDTH = 220;

export class Engine {
  constructor(p) {
    this.p = p;

    // Settings must be loaded before any component reads them.
    this.settings = new Settings();
    this.settingsStore = new SettingsStore(this.settings);
    this.settingsStore.load();   // merges persisted values directly into settings.values
    this.settingsStore.init();   // subscribes for debounced auto-save + flush handlers

    this.clock = new Clock();
    this.cameraRig = new CameraRig(this.p, this.settings);
    this.sky = new Sky();
    this.floor = new Floor(this.p, this.settings);
    this.world = new World();
    this.collisionSystem = new CollisionSystem();
    this.physicsWorld  = new PhysicsWorld();
    this.player = new Player(this.settings, this.cameraRig, this.world, this.collisionSystem, this.physicsWorld);

    this.inputManager = new InputManager(this.p, this.settings);
    this.keyboardMouseInput = new KeyboardMouseInput(this.p, this.settings);
    this.inputManager.addSource(this.keyboardMouseInput);

    // ObjectSpawner reconciles on construction using already-loaded settings.
    this.objectSpawner = new ObjectSpawner(this.world, this.settings, this.physicsWorld);
    this.dropAnimator  = new DropAnimator(this.physicsWorld);

    this.raycaster = new Raycaster(this.cameraRig, this.world, this.settings);
    this.selectionManager = new SelectionManager();
    this.reticle = new Reticle();
    this.infoPanel = new InfoPanel();
    this.controlPane = new ControlPane(this.p, this.settings, this.settingsStore);
    this.debugOverlay = new DebugOverlay(this.clock, this.player, this.selectionManager);

    this.selectionManager.onSelectionChange = (object) => {
      this.infoPanel.update(object, 'selected');
    };

    this.settings.subscribe((path, value) => {
      if (path === 'debug.enabled') {
        this.debugOverlay.setVisible(Boolean(value));
      }
      if (path === '*') {
        this.floor = new Floor(this.p, this.settings);
        this.cameraRig.updateProjection();
        this.objectSpawner.reconcile();
        this.debugOverlay.setVisible(Boolean(this.settings.get('debug.enabled')));
        if (this.p.canvas) this.resize();
        return;
      }
      if (path === 'view.fov' || path === 'view.near' || path === 'view.far') {
        this.cameraRig.updateProjection();
      }
      if (path === 'view.gridFadeDistance') {
        this.floor = new Floor(this.p, this.settings);
      }
      if (path === 'view.aspectRatio' || path === 'ui.paneOpen') {
        if (this.p.canvas) this.resize();
      }
      if (path.startsWith('objects.count.')) {
        this.objectSpawner.reconcile();
      }
    });
  }

  setup() {
    this.p.frameRate(60);
    this.p.createCanvas(this.p.windowWidth, this.p.windowHeight, this.p.WEBGL, null, { antialias: true });
    this.keyboardMouseInput.attach();
    document.addEventListener('fullscreenchange', () => this.resize());
    this.controlPane.mount();
    this.infoPanel.mount();
    this.reticle.mount();
    this.debugOverlay.mount();
    this.debugOverlay.setVisible(Boolean(this.settings.get('debug.enabled')));
    this.resize();
    this.clock.begin();
    // Hand all existing physics bodies to the drop animator in random order
    // so volumes of different types fall interleaved rather than type-by-type.
    const bodies = [...this.physicsWorld.bodies];
    for (let i = bodies.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [bodies[i], bodies[j]] = [bodies[j], bodies[i]];
    }
    this.dropAnimator.init(bodies);
  }

  resize() {
    const paneOpen = this.settings.get('ui.paneOpen');
    const offsetX = paneOpen ? PANE_WIDTH : 0;
    const availW = this.p.windowWidth - offsetX;
    const availH = this.p.windowHeight;

    const ratio = this.settings.get('view.aspectRatio') ?? 'Fill';
    let canvasW = availW;
    let canvasH = availH;

    if (ratio !== 'Fill') {
      const [rW, rH] = ratio.split(':').map(Number);
      const target = rW / rH;
      if (availW / availH > target) {
        canvasW = Math.round(availH * target);
      } else {
        canvasH = Math.round(availW / target);
      }
    }

    this.p.resizeCanvas(canvasW, canvasH);

    // Position canvas centred in the pane-excluded viewport area.
    const canvas = this.p.canvas;
    const left = offsetX + Math.round((availW - canvasW) / 2);
    const top = Math.round((availH - canvasH) / 2);
    canvas.style.position = 'fixed';
    canvas.style.left = `${left}px`;
    canvas.style.top = `${top}px`;

    this.cameraRig.updateProjection();
    this.reticle.setCenter(left + Math.round(canvasW / 2), top + Math.round(canvasH / 2));
  }

  update() {
    const dt = this.clock.update();
    if (dt <= 0) return;

    this.dropAnimator.update(dt);
    this.physicsWorld.step(dt);

    const intent = this.inputManager.getIntent();
    this.player.update(intent, dt);

    const hit = this.raycaster.update();
    this.selectionManager.updateFromRaycast(hit);

    if (intent.select) {
      this.selectionManager.select(this.selectionManager.hoverTarget);
    }
  }

  draw() {
    this.update();

    const p = this.p;
    this.sky.draw(p);
    p.ambientLight(50, 50, 50);
    p.directionalLight(220, 220, 220, -1, -1, -0.5);

    this.cameraRig.update();
    this.sky.drawStars(p, this.cameraRig.position);
    this.floor.draw(this.cameraRig);
    this.world.render(p);

    p.push();
    p.translate(0, 0, 0);
    p.noStroke();
    p.emissiveMaterial(0, 255, 0);
    p.sphere(0.12, 8, 6);
    p.pop();

    const hover = this.selectionManager.hoverTarget;
    this.reticle.setHover(Boolean(hover));
    if (hover && hover !== this.selectionManager.selectedTarget) {
      this.infoPanel.update(hover, 'hover');
    } else if (!this.selectionManager.selectedTarget) {
      this.infoPanel.update(null);
    }

    this.debugOverlay.update();
  }
}
