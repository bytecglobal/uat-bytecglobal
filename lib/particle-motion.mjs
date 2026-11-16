export const SHAPE_COUNT = 5;
const REFORM_MS = 850;
const HOLD_MS = 4500;
export const SCATTER_DURATION_MS = 750;
export const SCATTER_START_MS = REFORM_MS + HOLD_MS;
export const CYCLE_MS = SCATTER_START_MS + SCATTER_DURATION_MS;

export const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
const smoothstep = value => {
  const t = clamp(value);
  return t * t * t * (t * (t * 6 - 15) + 10);
};

export function sampleCycle(elapsed) {
  const cycle = Math.floor(Math.max(0, elapsed) / CYCLE_MS);
  const time = Math.max(0, elapsed) % CYCLE_MS;
  const scatter = time < REFORM_MS
    ? 1 - smoothstep(time / REFORM_MS)
    : smoothstep((time - SCATTER_START_MS) / SCATTER_DURATION_MS);
  return { shape: cycle % SHAPE_COUNT, scatter };
}

export function seed(index, salt = 1) {
  const n = Math.sin((index + 1) * 127.1 + salt * 311.7) * 43758.5453;
  return n - Math.floor(n);
}

// Sample strokes by length so outlines stay evenly populated at mobile counts.
function strokePoint(segments, u, index) {
  const lengths = segments.map(([a, b]) => Math.hypot(b[0] - a[0], b[1] - a[1]));
  let distance = u * lengths.reduce((sum, length) => sum + length, 0);
  let selected = lengths.length - 1;
  for (let i = 0; i < lengths.length; i++) {
    if (distance <= lengths[i]) { selected = i; break; }
    distance -= lengths[i];
  }
  const [a, b] = segments[selected];
  const t = clamp(distance / lengths[selected]);
  return [a[0] + (b[0] - a[0]) * t + (seed(index, 11) - .5) * .035,
    a[1] + (b[1] - a[1]) * t + (seed(index, 12) - .5) * .035,
    (seed(index, 13) - .5) * .12];
}

function box(x, y, w, h) {
  return [[[x, y], [x + w, y]], [[x + w, y], [x + w, y + h]],
    [[x + w, y + h], [x, y + h]], [[x, y + h], [x, y]]];
}

const phoneStrokes = [
  ...box(-.52, -.98, 1.04, 1.96),
  [[-.19, -.82], [.19, -.82]], [[-.15, .81], [.15, .81]],
  ...[-.29, .12].flatMap(x => [-.48, -.07, .34].flatMap(y => box(x, y, .19, .19))),
];
const browserStrokes = [
  ...box(-1.05, -.74, 2.1, 1.48), [[-1.05, -.44], [1.05, -.44]],
  ...[-.86, -.69, -.52].flatMap(x => box(x, -.63, .06, .06)),
  ...box(-.85, -.24, .65, .73),
  [[.03, -.2], [.83, -.2]], [[.03, .04], [.67, .04]],
  [[.03, .28], [.83, .28]], [[.03, .49], [.51, .49]],
];
const networkNodes = [-.85, 0, .85].flatMap((x, layer) =>
  Array.from({ length: layer === 1 ? 4 : 3 }, (_, i) =>
    [x, (i - (layer === 1 ? 1.5 : 1)) * .48]));
const networkEdges = networkNodes.slice(0, 3).flatMap(a => networkNodes.slice(3, 7).map(b => [a, b]))
  .concat(networkNodes.slice(3, 7).flatMap(a => networkNodes.slice(7).map(b => [a, b])));

export function shapePoint(index, count, shape) {
  const u = (index + .5) / count;
  const a = index * 2.3999632297;
  if (shape === 0) return strokePoint(phoneStrokes, u, index);
  if (shape === 1) return strokePoint(browserStrokes, u, index);
  if (shape === 2) {
    // Search lens and diagonal handle.
    if (u < .76) {
      const t = u / .76 * Math.PI * 2;
      const r = .65 + (seed(index, 11) - .5) * .09;
      return [-.22 + Math.cos(t) * r, -.22 + Math.sin(t) * r, (seed(index, 13) - .5) * .15];
    }
    return strokePoint([[[.25, .25], [.94, .94]]], (u - .76) / .24, index);
  }
  if (shape === 3) {
    if (u < .5) {
      const node = networkNodes[index % networkNodes.length];
      const r = .105 * Math.sqrt(seed(index, 14));
      return [node[0] + Math.cos(a) * r, node[1] + Math.sin(a) * r, (seed(index, 13) - .5) * .18];
    }
    return strokePoint(networkEdges, (u - .5) * 2, index);
  }
  // Continuous DevOps infinity loop, with depth at the crossing.
  const t = u * Math.PI * 2;
  const thickness = (seed(index, 11) - .5) * .085;
  return [(1.08 + thickness) * Math.cos(t), (.62 + thickness) * Math.sin(2 * t), .16 * Math.sin(t)];
}

export function scatterPoint(index) {
  const a = seed(index, 4) * Math.PI * 2;
  const y = seed(index, 6) * 2 - 1;
  const ring = Math.sqrt(1 - y * y);
  const r = 1.35 + seed(index, 5) * .5;
  return [Math.cos(a) * ring * r, y * r, Math.sin(a) * ring * r];
}
