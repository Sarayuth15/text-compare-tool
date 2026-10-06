import type { CompareOptions } from "./compare-options";
import { diffSequences } from "./sequence-diff";

export type DiffLineType = "equal" | "added" | "removed" | "changed";
export type DiffSegmentType = "equal" | "added" | "removed";

export interface DiffSegment {
  type: DiffSegmentType;
  text: string;
}

export interface DiffSide {
  /** 1-based line number in its own text. */
  lineNumber: number;
  text: string;
  /** Word-level highlights. Only set on changed lines in word mode. */
  segments?: DiffSegment[];
}

export interface DiffLine {
  type: DiffLineType;
  original: DiffSide | null;
  modified: DiffSide | null;
}

export interface DiffStats {
  added: number;
  removed: number;
  changed: number;
  unchanged: number;
}

export interface DiffResult {
  lines: DiffLine[];
  stats: DiffStats;
  identical: boolean;
}

type NormalizeOptions = Pick<CompareOptions, "ignoreWhitespace" | "ignoreCase">;

const LINE_BREAK_PATTERN = /\r\n|\r|\n/;
const TOKEN_PATTERN = /[\p{L}\p{N}_]+|\s+|[^\p{L}\p{N}_\s]/gu;
const WHITESPACE_ONLY_PATTERN = /^\s+$/;

export function splitLines(text: string): string[] {
  return text === "" ? [] : text.split(LINE_BREAK_PATTERN);
}

/** Splits text into words, whitespace runs, and single punctuation characters. */
export function tokenize(text: string): string[] {
  return text.match(TOKEN_PATTERN) ?? [];
}

function normalize(text: string, options: NormalizeOptions): string {
  let result = text;
  if (options.ignoreWhitespace) {
    result = result.replace(/\s+/g, " ").trim();
  }
  if (options.ignoreCase) {
    result = result.toLowerCase();
  }
  return result;
}

export function compareTexts(
  original: string,
  modified: string,
  options: CompareOptions,
): DiffResult {
  const originalLines = splitLines(original);
  const modifiedLines = splitLines(modified);
  const edits = diffSequences(
    originalLines.map((line) => normalize(line, options)),
    modifiedLines.map((line) => normalize(line, options)),
  );

  const lines: DiffLine[] = [];
  let removedRun: number[] = [];
  let addedRun: number[] = [];

  const flushRuns = () => {
    lines.push(
      ...pairHunk(removedRun, addedRun, originalLines, modifiedLines, options),
    );
    removedRun = [];
    addedRun = [];
  };

  for (const edit of edits) {
    if (edit.type === "removed") {
      removedRun.push(edit.aIndex);
    } else if (edit.type === "added") {
      addedRun.push(edit.bIndex);
    } else {
      flushRuns();
      lines.push({
        type: "equal",
        original: toSide(originalLines, edit.aIndex),
        modified: toSide(modifiedLines, edit.bIndex),
      });
    }
  }
  flushRuns();

  const stats = countLines(lines);
  return {
    lines,
    stats,
    identical: stats.added + stats.removed + stats.changed === 0,
  };
}

/**
 * Pairs removed and added lines from the same hunk, in order, as changed
 * lines. Leftovers stay as plain removals or additions.
 */
function pairHunk(
  removedIndexes: number[],
  addedIndexes: number[],
  originalLines: string[],
  modifiedLines: string[],
  options: CompareOptions,
): DiffLine[] {
  const pairCount = Math.min(removedIndexes.length, addedIndexes.length);
  const result: DiffLine[] = [];

  for (let i = 0; i < pairCount; i++) {
    const original = toSide(originalLines, removedIndexes[i]);
    const modified = toSide(modifiedLines, addedIndexes[i]);
    if (options.mode === "words") {
      const segments = diffWords(original.text, modified.text, options);
      original.segments = segments.original;
      modified.segments = segments.modified;
    }
    result.push({ type: "changed", original, modified });
  }

  for (const index of removedIndexes.slice(pairCount)) {
    result.push({
      type: "removed",
      original: toSide(originalLines, index),
      modified: null,
    });
  }
  for (const index of addedIndexes.slice(pairCount)) {
    result.push({
      type: "added",
      original: null,
      modified: toSide(modifiedLines, index),
    });
  }

  return result;
}

export function diffWords(
  originalText: string,
  modifiedText: string,
  options: NormalizeOptions,
): { original: DiffSegment[]; modified: DiffSegment[] } {
  const originalTokens = tokenize(originalText);
  const modifiedTokens = tokenize(modifiedText);
  const edits = diffSequences(
    originalTokens.map((token) => normalize(token, options)),
    modifiedTokens.map((token) => normalize(token, options)),
  );

  const original: DiffSegment[] = [];
  const modified: DiffSegment[] = [];
  const isIgnored = (token: string) =>
    options.ignoreWhitespace && WHITESPACE_ONLY_PATTERN.test(token);

  for (const edit of edits) {
    if (edit.type === "equal") {
      appendSegment(original, "equal", originalTokens[edit.aIndex]);
      appendSegment(modified, "equal", modifiedTokens[edit.bIndex]);
    } else if (edit.type === "removed") {
      const token = originalTokens[edit.aIndex];
      appendSegment(original, isIgnored(token) ? "equal" : "removed", token);
    } else {
      const token = modifiedTokens[edit.bIndex];
      appendSegment(modified, isIgnored(token) ? "equal" : "added", token);
    }
  }

  return { original, modified };
}

function appendSegment(
  segments: DiffSegment[],
  type: DiffSegmentType,
  text: string,
): void {
  const last = segments[segments.length - 1];
  if (last && last.type === type) {
    last.text += text;
  } else {
    segments.push({ type, text });
  }
}

function toSide(lines: string[], index: number): DiffSide {
  return { lineNumber: index + 1, text: lines[index] };
}

function countLines(lines: DiffLine[]): DiffStats {
  const stats: DiffStats = { added: 0, removed: 0, changed: 0, unchanged: 0 };
  for (const line of lines) {
    if (line.type === "equal") {
      stats.unchanged++;
    } else {
      stats[line.type]++;
    }
  }
  return stats;
}
