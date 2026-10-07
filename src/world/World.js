export class World {
  constructor() {
    this.objects = [];
  }

  add(object) {
    this.objects.push(object);
    return object;
  }

  remove(object) {
    this.objects = this.objects.filter((entry) => entry !== object);
    this.reindexAll();
  }

  clear() {
    this.objects = [];
  }

  reindexAll() {
    const byType = {};
    for (const object of this.objects) {
      if (!byType[object.type]) {
        byType[object.type] = [];
      }
      byType[object.type].push(object);
    }

    for (const type of Object.keys(byType)) {
      byType[type]
        .sort((a, b) => (a.index ?? 0) - (b.index ?? 0))
        .forEach((object, index) => object.setIndex(index));
    }
  }

  render(p) {
    for (const object of this.objects) {
      object.draw(p);
    }
  }

  counts() {
    const counts = { cube: 0, pyramid: 0, cone: 0, sphere: 0 };
    for (const object of this.objects) {
      if (counts[object.type] !== undefined) {
        counts[object.type] += 1;
      }
    }
    return counts;
  }

  getByType(type) {
    return this.objects.filter((object) => object.type === type);
  }
}
