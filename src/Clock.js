export class Clock {
  constructor() {
    this.lastFrameTime = 0;
    this.deltaTime = 0;
    this.fps = 60;
    this.frameCounter = 0;
    this.frameWindowStart = 0;
    this.accumulatedTime = 0;
  }

  begin() {
    const now = performance.now();
    this.lastFrameTime = now;
    this.frameWindowStart = now;
    this.frameCounter = 0;
    this.accumulatedTime = 0;
  }

  update() {
    const now = performance.now();
    const rawDelta = (now - this.lastFrameTime) / 1000;
    const clamped = Math.min(Math.max(rawDelta, 0), 0.05);
    this.deltaTime = clamped;
    this.lastFrameTime = now;

    this.accumulatedTime += rawDelta;
    this.frameCounter += 1;

    if (this.accumulatedTime >= 0.25) {
      this.fps = this.frameCounter / this.accumulatedTime;
      this.frameCounter = 0;
      this.accumulatedTime = 0;
    }

    return this.deltaTime;
  }

  getDt() {
    return this.deltaTime;
  }

  getFps() {
    return this.fps;
  }
}
