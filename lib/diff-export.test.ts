import { describe, expect, it } from "vitest";
import type { CompareOptions } from "@/lib/compare-options";
import { compareTexts } from "@/lib/diff";
import { formatDiffAsText } from "@/lib/diff-export";

const LINES: CompareOptions = {
  mode: "lines",
  ignoreWhitespace: false,
  ignoreCase: false,
};

describe("formatDiffAsText", () => {
  it("writes unified-diff style prefixes", () => {
    const result = compareTexts("a\nb\nc\nd", "a\nB\nc\ne\nf", LINES);
    expect(formatDiffAsText(result)).toBe(
      ["--- Original", "+++ Modified", "  a", "- b", "+ B", "  c", "- d", "+ e", "+ f"].join(
        "\n",
      ),
    );
  });

  it("writes only context lines for identical texts", () => {
    expect(formatDiffAsText(compareTexts("x", "x", LINES))).toBe(
      "--- Original\n+++ Modified\n  x",
    );
  });

  it("writes just the header for empty texts", () => {
    expect(formatDiffAsText(compareTexts("", "", LINES))).toBe(
      "--- Original\n+++ Modified",
    );
  });
});
