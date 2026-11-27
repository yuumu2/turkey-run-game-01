export function mulberry32(seed) {
  let state = seed >>> 0;

  return () => {
    state = (state + 0x6D2B79F5) >>> 0;
    let value = Math.imul(state ^ (state >>> 15), state | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 0x100000000;
  };
}

export function randRange(rng, min, max) {
  return min + rng() * (max - min);
}

// Both integer bounds are inclusive.
export function randInt(rng, min, max) {
  const first = Math.ceil(min);
  const last = Math.floor(max);
  return Math.floor(rng() * (last - first + 1)) + first;
}

export function pick(rng, array) {
  return array.length ? array[randInt(rng, 0, array.length - 1)] : undefined;
}
