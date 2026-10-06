/**
 * Generic sequence diff based on Myers' O(ND) algorithm, using the
 * linear-space "middle snake" variant so memory stays proportional to the
 * input size. A deadline guards against pathological inputs: once it
 * passes, remaining ranges are reported as a plain remove + add, which is
 * still a correct (if not minimal) diff.
 */

export type EditType = "equal" | "removed" | "added";

export interface Edit {
  type: EditType;
  /** Index in the original sequence, or -1 for added items. */
  aIndex: number;
  /** Index in the modified sequence, or -1 for removed items. */
  bIndex: number;
}

const DEFAULT_TIMEOUT_MS = 1000;

interface DiffContext {
  a: Int32Array;
  b: Int32Array;
  removed: Uint8Array;
  added: Uint8Array;
  deadline: number;
}

interface SplitPoint {
  x: number;
  y: number;
}

export function diffSequences(
  a: readonly string[],
  b: readonly string[],
  timeoutMs: number = DEFAULT_TIMEOUT_MS,
): Edit[] {
  const [aIds, bIds] = toIds(a, b);

  if (!hasSharedItem(aIds, bIds)) {
    return [
      ...a.map((_, index): Edit => ({ type: "removed", aIndex: index, bIndex: -1 })),
      ...b.map((_, index): Edit => ({ type: "added", aIndex: -1, bIndex: index })),
    ];
  }

  const context: DiffContext = {
    a: aIds,
    b: bIds,
    removed: new Uint8Array(a.length),
    added: new Uint8Array(b.length),
    deadline: Date.now() + timeoutMs,
  };

  compareRange(context, 0, a.length, 0, b.length);
  return buildEdits(context.removed, context.added);
}

/** Maps strings to integers so the hot loop compares numbers, not strings. */
function toIds(a: readonly string[], b: readonly string[]): [Int32Array, Int32Array] {
  const ids = new Map<string, number>();
  const encode = (items: readonly string[]) => {
    const result = new Int32Array(items.length);
    items.forEach((item, index) => {
      let id = ids.get(item);
      if (id === undefined) {
        id = ids.size;
        ids.set(item, id);
      }
      result[index] = id;
    });
    return result;
  };
  return [encode(a), encode(b)];
}

/** Ids are assigned in order, so any id in `b` below max(a) + 1 also occurs in `a`. */
function hasSharedItem(aIds: Int32Array, bIds: Int32Array): boolean {
  let aIdLimit = 0;
  for (const id of aIds) {
    aIdLimit = Math.max(aIdLimit, id + 1);
  }
  return bIds.some((id) => id < aIdLimit);
}

function compareRange(
  context: DiffContext,
  aLo: number,
  aHi: number,
  bLo: number,
  bHi: number,
): void {
  const { a, b, removed, added } = context;

  while (aLo < aHi && bLo < bHi && a[aLo] === b[bLo]) {
    aLo++;
    bLo++;
  }
  while (aHi > aLo && bHi > bLo && a[aHi - 1] === b[bHi - 1]) {
    aHi--;
    bHi--;
  }

  if (aLo === aHi) {
    added.fill(1, bLo, bHi);
    return;
  }
  if (bLo === bHi) {
    removed.fill(1, aLo, aHi);
    return;
  }

  const split = findMiddleSnake(context, aLo, aHi, bLo, bHi);
  const isUsefulSplit =
    split !== null &&
    !(split.x === aLo && split.y === bLo) &&
    !(split.x === aHi && split.y === bHi);

  if (!isUsefulSplit) {
    removed.fill(1, aLo, aHi);
    added.fill(1, bLo, bHi);
    return;
  }

  compareRange(context, aLo, split.x, bLo, split.y);
  compareRange(context, split.x, aHi, split.y, bHi);
}

/**
 * Walks forward from the start and backward from the end at the same time
 * and returns the point where the two shortest edit paths meet.
 */
function findMiddleSnake(
  context: DiffContext,
  aLo: number,
  aHi: number,
  bLo: number,
  bHi: number,
): SplitPoint | null {
  const { a, b } = context;
  const n = aHi - aLo;
  const m = bHi - bLo;
  const maxD = Math.ceil((n + m) / 2);
  const vOffset = maxD;
  const vLength = 2 * maxD + 2;
  const forward = new Int32Array(vLength).fill(-1);
  const backward = new Int32Array(vLength).fill(-1);
  forward[vOffset + 1] = 0;
  backward[vOffset + 1] = 0;

  const delta = n - m;
  const checkOnForward = delta % 2 !== 0;
  let k1Start = 0;
  let k1End = 0;
  let k2Start = 0;
  let k2End = 0;

  for (let d = 0; d < maxD; d++) {
    if (Date.now() > context.deadline) {
      return null;
    }

    for (let k1 = -d + k1Start; k1 <= d - k1End; k1 += 2) {
      const k1Offset = vOffset + k1;
      let x1 =
        k1 === -d || (k1 !== d && forward[k1Offset - 1] < forward[k1Offset + 1])
          ? forward[k1Offset + 1]
          : forward[k1Offset - 1] + 1;
      let y1 = x1 - k1;
      while (x1 < n && y1 < m && a[aLo + x1] === b[bLo + y1]) {
        x1++;
        y1++;
      }
      forward[k1Offset] = x1;

      if (x1 > n) {
        k1End += 2;
      } else if (y1 > m) {
        k1Start += 2;
      } else if (checkOnForward) {
        const k2Offset = vOffset + delta - k1;
        if (k2Offset >= 0 && k2Offset < vLength && backward[k2Offset] !== -1) {
          if (x1 >= n - backward[k2Offset]) {
            return { x: aLo + x1, y: bLo + y1 };
          }
        }
      }
    }

    for (let k2 = -d + k2Start; k2 <= d - k2End; k2 += 2) {
      const k2Offset = vOffset + k2;
      let x2 =
        k2 === -d || (k2 !== d && backward[k2Offset - 1] < backward[k2Offset + 1])
          ? backward[k2Offset + 1]
          : backward[k2Offset - 1] + 1;
      let y2 = x2 - k2;
      while (x2 < n && y2 < m && a[aHi - x2 - 1] === b[bHi - y2 - 1]) {
        x2++;
        y2++;
      }
      backward[k2Offset] = x2;

      if (x2 > n) {
        k2End += 2;
      } else if (y2 > m) {
        k2Start += 2;
      } else if (!checkOnForward) {
        const k1Offset = vOffset + delta - k2;
        if (k1Offset >= 0 && k1Offset < vLength && forward[k1Offset] !== -1) {
          const x1 = forward[k1Offset];
          const y1 = vOffset + x1 - k1Offset;
          if (x1 >= n - x2) {
            return { x: aLo + x1, y: bLo + y1 };
          }
        }
      }
    }
  }

  return null;
}

/** Converts change flags into an ordered edit script (removals before additions). */
function buildEdits(removed: Uint8Array, added: Uint8Array): Edit[] {
  const edits: Edit[] = [];
  let i = 0;
  let j = 0;

  while (i < removed.length || j < added.length) {
    if (i < removed.length && removed[i]) {
      edits.push({ type: "removed", aIndex: i++, bIndex: -1 });
    } else if (j < added.length && added[j]) {
      edits.push({ type: "added", aIndex: -1, bIndex: j++ });
    } else {
      edits.push({ type: "equal", aIndex: i++, bIndex: j++ });
    }
  }

  return edits;
}
