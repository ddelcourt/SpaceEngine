import { Clock } from './Clock.js';
import { Settings } from './Settings.js';
import { SettingsStore } from './SettingsStore.js';
import { CameraRig } from './CameraRig.js';
import { Floor } from './Floor.js';
import { Player } from './Player.js';
import { InputManager } from './input/InputManager.js';
import { KeyboardMouseInput } from './input/KeyboardMouseInput.js';
import { World } from './world/World.js';
import { ObjectSpawner } from './world/ObjectSpawner.js';
import { Raycaster } from './interaction/Raycaster.js';
import { SelectionManager } from './interaction/SelectionManager.js';
import { Reticle } from './ui/Reticle.js';
import { InfoPanel } from './ui/InfoPanel.js';
import { ControlPane } from './ui/ControlPane.js';
import { CollisionSystem } from './physics/CollisionSystem.js';

export class Engine {
  constructor(p) {
    this.p = p;
    this.settings = new Settings();
    this.settingsStore = new SettingsStore(this.settings);
    this.clock = new Clock();
    this.cameraRig = new CameraRig(this.p, this.settings);
    this.floor = new Floor(this.p, this.settings);
    this.world = new World();
    this.collisionSystem = new CollisionSystem();
    this.player = new Player(this.settings, this.cameraRig, this.world, this.collisionSystem);

    this.inputManager = new InputManager(this.p, this.settings);
    this.keyboardMouseInput = new KeyboardMouseInput(this.p, this.settings);
    this.inputManager.addSource(this.keyboardMouseInput);
    this.objectSpawner = new ObjectSpawner(this.world, this.settings);
    this.raycaster = new Raycaster(this.cameraRig, this.world, this.settings);
    this.selectionManager = new SelectionManager();
    this.reticle = new Reticle();
    this.infoPanel = new InfoPanel();
    this.controlPane = new ControlPane(this.p, this.settings);

    this.selectionManager.onSelectionChange = (object) => {
      this.infoPanel.update(object, 'selected');
    };

    this.settings.subscribe((path) => {
      if (path === 'view.fov' || path === 'view.near' || path === 'view.far') {
        this.cameraRig.updateProjection();
      }
      if (path === 'view.gridFadeDistance') {
        this.floor = new Floor(this.p, this.settings);
      }
      if (path.startsWith('objects.count.')) {
        this.objectSpawner.reconcile();
      }
      this.settingsStore.save();
    });

    this.settingsStore.load();
    this.objectSpawner.reconcile();
  }

  setup() {
    this.p.frameRate(60);
    this.p.createCanvas(this.p.windowWidth, this.p.windowHeight, this.p.WEBGL);
    this.keyboardMouseInput.attach();
    this.controlPane.mount();
    this.infoPanel.mount();
    this.reticle.mount();
    this.p.pixelDensity(1);
    this.resize();
    this.clock.begin();
  }

  resize() {
    this.p.resizeCanvas(this.p.windowWidth, this.p.windowHeight);
    this.cameraRig.updateProjection();
  }

  update() {
    const dt = this.clock.update();
    if (dt <= 0) return;

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
    p.background(17, 17, 17);
    p.ambientLight(50, 50, 50);
    p.directionalLight(220, 220, 220, -1, -1, -0.5);

    this.cameraRig.update();
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
  }
}
