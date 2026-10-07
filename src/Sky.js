// Dark midnight-blue sky. Each channel is a simple constant so the
// colour is trivial to tweak or later drive from settings.
const R = 14;
const G = 18;
const B = 35;

export class Sky {
  draw(p) {
    p.background(R, G, B);
  }
}
