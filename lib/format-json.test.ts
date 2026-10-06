import { describe, expect, it } from "vitest";
import { formatJson } from "@/lib/format-json";

describe("formatJson", () => {
  it("pretty-prints objects with two-space indentation", () => {
    expect(formatJson('{"b":1,"a":[1,2]}')).toEqual({
      ok: true,
      text: '{\n  "b": 1,\n  "a": [\n    1,\n    2\n  ]\n}',
    });
  });

  it("accepts surrounding whitespace and non-object values", () => {
    expect(formatJson("  [1, 2]  ")).toEqual({ ok: true, text: "[\n  1,\n  2\n]" });
    expect(formatJson('"text"')).toEqual({ ok: true, text: '"text"' });
  });

  it.each(["{a:1}", '{"a":1,}', "", "{"])("rejects invalid JSON %j", (input) => {
    const result = formatJson(input);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toMatch(/^Invalid JSON: /);
    }
  });
});
