// Sabit seed ilə deterministik random generator (mulberry32).
// Bütün demo dataset bu funksiyadan istifadə edərək YALNIZ BİR DƏFƏ yaradılır
// (bax: src/data/mock/index.ts) və modul səviyyəsində keşlənir ki, hər render-də
// yenidən yaradılmasın və ekranlar arasında rəqəmlər ziddiyyətli olmasın.

export function mulberry32(seed: number) {
  let a = seed;
  return function random() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const SEED = 20260101;

export function createRng(offset = 0) {
  return mulberry32(SEED + offset);
}

export function pick<T>(rng: () => number, arr: T[]): T {
  return arr[Math.floor(rng() * arr.length)];
}

export function randInt(rng: () => number, min: number, max: number): number {
  return Math.floor(rng() * (max - min + 1)) + min;
}

export function randFloat(rng: () => number, min: number, max: number, decimals = 2): number {
  const v = rng() * (max - min) + min;
  const factor = 10 ** decimals;
  return Math.round(v * factor) / factor;
}

export function weighted<T>(rng: () => number, items: Array<[T, number]>): T {
  const total = items.reduce((s, [, w]) => s + w, 0);
  let r = rng() * total;
  for (const [item, w] of items) {
    r -= w;
    if (r <= 0) return item;
  }
  return items[items.length - 1][0];
}

export function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function daysAgo(n: number, from: Date): Date {
  const d = new Date(from);
  d.setUTCDate(d.getUTCDate() - n);
  return d;
}

// Sabit "bu gün" — demo dataset-in tutarlı qalması üçün fiksləndi.
export const DEMO_TODAY = new Date('2026-09-24T00:00:00.000Z');
