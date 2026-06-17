// Injectable RNG seam (plan decision: Python's `random` and JS's Math.random() can't be made
// cross-language-deterministic, and nothing requires that — this lets tests substitute a fixed
// sequence instead of asserting against live randomness). Mirrors PortMasters2/server.py's
// rand()/choice()/weighted_choice() (lines 425-438) plus random.shuffle.
export interface Rng {
  /** [0, 1), mirrors Python's random.random(). */
  random(): number;
  /** Inclusive of both ends, mirrors Python's random.randint(a, b). */
  randint(a: number, b: number): number;
  choice<T>(arr: readonly T[]): T;
  weightedChoice<T>(items: ReadonlyArray<readonly [T, number]>): T;
  /** In place, Fisher-Yates, mirrors Python's random.shuffle(). */
  shuffle<T>(arr: T[]): void;
}

export const defaultRng: Rng = {
  random() {
    return Math.random();
  },
  randint(a, b) {
    return a + Math.floor(this.random() * (b - a + 1));
  },
  choice<T>(arr: readonly T[]): T {
    return arr[Math.floor(this.random() * arr.length)] as T;
  },
  weightedChoice<T>(items: ReadonlyArray<readonly [T, number]>): T {
    const total = items.reduce((sum, [, weight]) => sum + weight, 0);
    let r = this.random() * total;
    for (const [item, weight] of items) {
      r -= weight;
      if (r <= 0) return item;
    }
    return items[0]![0];
  },
  shuffle<T>(arr: T[]): void {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(this.random() * (i + 1));
      const tmp = arr[i] as T;
      arr[i] = arr[j] as T;
      arr[j] = tmp;
    }
  },
};
