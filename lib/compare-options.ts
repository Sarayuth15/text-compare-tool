export type CompareMode = "lines" | "words";

export interface CompareOptions {
  mode: CompareMode;
  ignoreWhitespace: boolean;
  ignoreCase: boolean;
}

export const DEFAULT_COMPARE_OPTIONS: CompareOptions = {
  mode: "lines",
  ignoreWhitespace: false,
  ignoreCase: false,
};

export function isSameOptions(a: CompareOptions, b: CompareOptions): boolean {
  return (
    a.mode === b.mode &&
    a.ignoreWhitespace === b.ignoreWhitespace &&
    a.ignoreCase === b.ignoreCase
  );
}
