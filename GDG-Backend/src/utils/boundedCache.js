/**
 * BoundedMap
 * A lightweight Map subclass with a hard capacity ceiling (default: 200 entries).
 * Automatically evicts the oldest entry when capacity is exceeded to guarantee
 * zero memory leaks and strict memory safety in memory-constrained environments
 * such as Render Free Tier (512MB RAM).
 */
class BoundedMap extends Map {
  constructor(maxSize = 200) {
    super();
    this.maxSize = maxSize;
  }

  set(key, value) {
    if (this.size >= this.maxSize && !this.has(key)) {
      const oldestKey = this.keys().next().value;
      if (oldestKey !== undefined) {
        this.delete(oldestKey);
      }
    }
    return super.set(key, value);
  }
}

module.exports = { BoundedMap };
