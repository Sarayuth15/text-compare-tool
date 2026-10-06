import { describe, expect, it } from "vitest";
import { diffSequences, type Edit } from "@/lib/sequence-diff";

function lcsLength(a: string[], b: string[]): number {
  const dp = Array.from({ length: a.length + 1 }, () =>
    new Array<number>(b.length + 1).fill(0),
  );
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      dp[i][j] =
        a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1] + 1
          : Math.max(dp[i - 1][j], dp[i][j - 1]);
    }
  }
  return dp[a.length][b.length];
}

/** Checks the script walks both sequences in order and only matches equal items. */
function expectValidScript(a: string[], b: string[], edits: Edit[]): number {
  let i = 0;
  let j = 0;
  let equal = 0;
  for (const edit of edits) {
    if (edit.type === "equal") {
      expect([edit.aIndex, edit.bIndex]).toEqual([i, j]);
      expect(a[i++]).toBe(b[j++]);
      equal++;
    } else if (edit.type === "removed") {
      expect(edit.aIndex).toBe(i++);
    } else {
      expect(edit.bIndex).toBe(j++);
    }
  }
  expect([i, j]).toEqual([a.length, b.length]);
  return equal;
}

function seededRandom(seed: number) {
  let state = seed;
  return (max: number) => {
    state = (state * 1103515245 + 12345) & 0x7fffffff;
    return state % max;
  };
}

describe("diffSequences", () => {
  it("returns only equal edits for identical input", () => {
    const edits = diffSequences(["a", "b"], ["a", "b"]);
    expect(edits.map((edit) => edit.type)).toEqual(["equal", "equal"]);
  });

  it("handles empty sequences", () => {
    expect(diffSequences([], [])).toEqual([]);
    expect(diffSequences([], ["a"]).map((edit) => edit.type)).toEqual(["added"]);
    expect(diffSequences(["a"], []).map((edit) => edit.type)).toEqual(["removed"]);
  });

  it("orders removals before additions inside a change", () => {
    const edits = diffSequences(["a", "x", "c"], ["a", "y", "c"]);
    expect(edits.map((edit) => edit.type)).toEqual([
      "equal",
      "removed",
      "added",
      "equal",
    ]);
  });

  it("produces valid, minimal scripts for random input", () => {
    const random = seededRandom(42);
    for (let iteration = 0; iteration < 2000; iteration++) {
      const alphabet = 1 + random(5);
      const a = Array.from({ length: random(25) }, () => String(random(alphabet)));
      const b = Array.from({ length: random(25) }, () => String(random(alphabet)));
      const equal = expectValidScript(a, b, diffSequences(a, b));
      expect(equal).toBe(lcsLength(a, b));
    }
  });

  it("stays fast for completely different large inputs", () => {
    const a = Array.from({ length: 20000 }, (_, i) => `a${i}`);
    const b = Array.from({ length: 20000 }, (_, i) => `b${i}`);
    const start = performance.now();
    const edits = diffSequences(a, b);
    expect(performance.now() - start).toBeLessThan(1000);
    expect(edits).toHaveLength(40000);
  });

  it("falls back to a valid script when the time budget runs out", () => {
    const random = seededRandom(7);
    const a = Array.from({ length: 3000 }, () => `t${random(50)}`);
    const b = Array.from({ length: 3000 }, () => `t${random(50)}`);
    expectValidScript(a, b, diffSequences(a, b, 0));
  });
});
