import type { DiffLine, DiffResult } from "./diff";

const HEADER = ["--- Original", "+++ Modified"];

/** Formats a comparison as plain text using unified-diff style prefixes. */
export function formatDiffAsText(result: DiffResult): string {
  return [...HEADER, ...result.lines.flatMap(formatLine)].join("\n");
}

function formatLine(line: DiffLine): string[] {
  const output: string[] = [];
  if (line.type === "equal") {
    output.push(`  ${line.original?.text ?? ""}`);
    return output;
  }
  if (line.original) {
    output.push(`- ${line.original.text}`);
  }
  if (line.modified) {
    output.push(`+ ${line.modified.text}`);
  }
  return output;
}
