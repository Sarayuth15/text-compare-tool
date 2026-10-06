import { describe, expect, it } from "vitest";
import type { CompareOptions } from "@/lib/compare-options";
import {
  compareTexts,
  diffWords,
  splitLines,
  tokenize,
  type DiffResult,
  type DiffSegment,
} from "@/lib/diff";

const LINES: CompareOptions = {
  mode: "lines",
  ignoreWhitespace: false,
  ignoreCase: false,
};
const WORDS: CompareOptions = { ...LINES, mode: "words" };

const types = (result: DiffResult) => result.lines.map((line) => line.type);
const joinSegments = (segments: DiffSegment[] = []) =>
  segments.map((segment) => segment.text).join("");

describe("splitLines", () => {
  it("treats empty text as no lines", () => {
    expect(splitLines("")).toEqual([]);
  });

  it("keeps a trailing empty line", () => {
    expect(splitLines("a\n")).toEqual(["a", ""]);
  });

  it("supports LF, CRLF and CR line breaks", () => {
    expect(splitLines("a\r\nb\rc\nd")).toEqual(["a", "b", "c", "d"]);
  });
});

describe("tokenize", () => {
  it("splits words, whitespace and punctuation", () => {
    expect(tokenize("foo(bar, 42)  é")).toEqual([
      "foo",
      "(",
      "bar",
      ",",
      " ",
      "42",
      ")",
      "  ",
      "é",
    ]);
  });
});

describe("compareTexts", () => {
  it("reports identical texts", () => {
    const result = compareTexts("a\nb", "a\nb", LINES);
    expect(result.identical).toBe(true);
    expect(result.stats).toEqual({ added: 0, removed: 0, changed: 0, unchanged: 2 });
  });

  it("handles both texts empty", () => {
    const result = compareTexts("", "", LINES);
    expect(result.lines).toEqual([]);
    expect(result.identical).toBe(true);
  });

  it("marks everything added when the original is empty", () => {
    const result = compareTexts("", "a\nb", LINES);
    expect(types(result)).toEqual(["added", "added"]);
    expect(result.lines[0].original).toBeNull();
    expect(result.lines[1].modified?.lineNumber).toBe(2);
  });

  it("marks everything removed when the modified text is empty", () => {
    expect(types(compareTexts("a\nb", "", LINES))).toEqual(["removed", "removed"]);
  });

  it("detects a changed line", () => {
    const result = compareTexts("a\nb\nc", "a\nx\nc", LINES);
    expect(types(result)).toEqual(["equal", "changed", "equal"]);
    expect(result.lines[1].original?.text).toBe("b");
    expect(result.lines[1].modified?.text).toBe("x");
    expect(result.lines[1].original?.segments).toBeUndefined();
  });

  it("keeps line numbers correct around an insertion", () => {
    const result = compareTexts("a\nc", "a\nb\nc", LINES);
    expect(types(result)).toEqual(["equal", "added", "equal"]);
    expect(result.lines[2].original?.lineNumber).toBe(2);
    expect(result.lines[2].modified?.lineNumber).toBe(3);
  });

  it("detects a deleted line", () => {
    expect(types(compareTexts("a\nb\nc", "a\nc", LINES))).toEqual([
      "equal",
      "removed",
      "equal",
    ]);
  });

  it("pairs uneven hunks in order and keeps leftovers", () => {
    const result = compareTexts("a\nb1\nb2\nc", "a\nx\nc", LINES);
    expect(types(result)).toEqual(["equal", "changed", "removed", "equal"]);
    expect(result.stats).toEqual({ added: 0, removed: 1, changed: 1, unchanged: 2 });
  });

  it("treats different line endings as equal", () => {
    expect(compareTexts("a\r\nb\rc", "a\nb\nc", LINES).identical).toBe(true);
  });

  it("counts a trailing newline as an added line", () => {
    expect(types(compareTexts("a", "a\n", LINES))).toEqual(["equal", "added"]);
  });

  it("ignores case when asked, keeping the original text", () => {
    expect(compareTexts("Hello World", "hello world", LINES).identical).toBe(false);
    const result = compareTexts("Hello World", "hello world", {
      ...LINES,
      ignoreCase: true,
    });
    expect(result.identical).toBe(true);
    expect(result.lines[0].original?.text).toBe("Hello World");
  });

  it("ignores whitespace differences but not missing word breaks", () => {
    const options = { ...LINES, ignoreWhitespace: true };
    expect(compareTexts("  a   b\t", "a b", LINES).identical).toBe(false);
    expect(compareTexts("  a   b\t", "a b", options).identical).toBe(true);
    expect(compareTexts("ab", "a b", options).identical).toBe(false);
  });

  it("adds word segments to changed lines in word mode", () => {
    const result = compareTexts("the quick fox", "the slow fox", WORDS);
    expect(result.lines[0].original?.segments).toEqual([
      { type: "equal", text: "the " },
      { type: "removed", text: "quick" },
      { type: "equal", text: " fox" },
    ]);
    expect(result.lines[0].modified?.segments).toEqual([
      { type: "equal", text: "the " },
      { type: "added", text: "slow" },
      { type: "equal", text: " fox" },
    ]);
  });

  it("builds segments that rebuild each line exactly", () => {
    const result = compareTexts("let x = foo(1, 2);", "const x = bar(1, 3);", WORDS);
    expect(joinSegments(result.lines[0].original?.segments)).toBe("let x = foo(1, 2);");
    expect(joinSegments(result.lines[0].modified?.segments)).toBe("const x = bar(1, 3);");
  });

  it("handles unicode and emoji", () => {
    const result = compareTexts("héllo 😀 мир", "héllo 😀 світ", WORDS);
    expect(result.lines[0].modified?.segments?.at(-1)).toEqual({
      type: "added",
      text: "світ",
    });
  });

  it("compares a 50k-line text with scattered edits quickly", () => {
    const original = Array.from({ length: 50000 }, (_, i) => `line ${i} some content`);
    const modified = original.map((line, i) => (i % 500 === 0 ? `${line} edited` : line));
    modified.splice(25000, 0, "inserted");

    const start = performance.now();
    const result = compareTexts(original.join("\n"), modified.join("\n"), WORDS);
    expect(performance.now() - start).toBeLessThan(1500);
    expect(result.stats.changed).toBe(100);
    expect(result.stats.added).toBe(1);
  });
});

describe("diffWords", () => {
  it("treats whitespace-only changes as equal when ignoring whitespace", () => {
    const segments = diffWords("Foo  bar baz", "foo bar qux", {
      ignoreCase: true,
      ignoreWhitespace: true,
    });
    expect(segments.original).toEqual([
      { type: "equal", text: "Foo  bar " },
      { type: "removed", text: "baz" },
    ]);
  });
});
