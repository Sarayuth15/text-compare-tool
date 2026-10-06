"use client";

import { useState, type CSSProperties } from "react";
import Button from "@/components/Button";
import type { DiffLine, DiffLineType, DiffSide } from "@/lib/diff";

/** Rows rendered per batch; keeps huge results from blocking the page. */
const RENDER_BATCH_SIZE = 2000;

interface DiffViewerProps {
  lines: DiffLine[];
}

type SideKind = "original" | "modified";

const SIDE_MARKERS: Record<SideKind, string> = { original: "−", modified: "+" };

const LINE_STYLES: Record<
  DiffLineType,
  { background: string; markerColor: string; label: string }
> = {
  equal: { background: "", markerColor: "", label: "" },
  added: { background: "bg-added-bg", markerColor: "text-added-fg", label: "Added" },
  removed: { background: "bg-removed-bg", markerColor: "text-removed-fg", label: "Removed" },
  changed: { background: "bg-changed-bg", markerColor: "text-changed-fg", label: "Changed" },
};

/** Widest line number in the result, so the number column fits it. */
function getLineNumberDigits(lines: DiffLine[]): number {
  let max = 0;
  for (const line of lines) {
    max = Math.max(max, line.original?.lineNumber ?? 0, line.modified?.lineNumber ?? 0);
  }
  return String(max).length;
}

export default function DiffViewer({ lines }: DiffViewerProps) {
  const [visibleCount, setVisibleCount] = useState(RENDER_BATCH_SIZE);
  const [batchedLines, setBatchedLines] = useState(lines);
  if (lines !== batchedLines) {
    setBatchedLines(lines);
    setVisibleCount(RENDER_BATCH_SIZE);
  }

  const visibleLines = lines.slice(0, visibleCount);
  const hiddenCount = lines.length - visibleLines.length;
  const lineNumberWidth = {
    "--line-number-width": `${getLineNumberDigits(lines)}ch`,
  } as CSSProperties;

  return (
    <div
      style={lineNumberWidth}
      className="overflow-hidden rounded-base border border-border bg-surface font-mono text-sm leading-6"
    >
      <div
        aria-hidden="true"
        className="hidden border-b border-border font-sans text-xs font-medium text-muted lg:grid lg:grid-cols-2 lg:divide-x lg:divide-border"
      >
        <div className="px-3 py-2">Original</div>
        <div className="px-3 py-2">Modified</div>
      </div>
      <div>
        {visibleLines.map((line, index) => (
          <div
            key={index}
            className="grid grid-cols-1 [contain-intrinsic-size:auto_1.5rem] [content-visibility:auto] lg:grid-cols-2 lg:divide-x lg:divide-border"
          >
            <DiffHalf kind="original" side={line.original} type={line.type} />
            <DiffHalf
              kind="modified"
              side={line.modified}
              type={line.type}
              hideOnMobile={line.type === "equal"}
            />
          </div>
        ))}
      </div>
      {hiddenCount > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border px-3 py-2 font-sans text-xs text-muted">
          <span>
            Showing {visibleLines.length.toLocaleString()} of{" "}
            {lines.length.toLocaleString()} lines
          </span>
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={() => setVisibleCount((count) => count + RENDER_BATCH_SIZE)}
            >
              Show {Math.min(RENDER_BATCH_SIZE, hiddenCount).toLocaleString()} more
            </Button>
            <Button size="sm" onClick={() => setVisibleCount(lines.length)}>
              Show all
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

interface DiffHalfProps {
  kind: SideKind;
  side: DiffSide | null;
  type: DiffLineType;
  hideOnMobile?: boolean;
}

function DiffHalf({ kind, side, type, hideOnMobile = false }: DiffHalfProps) {
  if (!side) {
    return <div aria-hidden="true" className="hidden bg-background lg:block" />;
  }

  const style = LINE_STYLES[type];

  return (
    <div
      className={`flex min-h-6 min-w-0 ${style.background} ${hideOnMobile ? "max-lg:hidden" : ""}`}
    >
      <span
        aria-hidden="true"
        className="w-[calc(var(--line-number-width)+1rem)] min-w-12 shrink-0 px-2 text-right text-muted tabular-nums select-none"
      >
        {side.lineNumber}
      </span>
      <span
        aria-hidden="true"
        className={`w-5 shrink-0 text-center font-semibold select-none ${style.markerColor}`}
      >
        {type === "equal" ? "" : SIDE_MARKERS[kind]}
      </span>
      <span className="min-w-0 flex-1 pr-3 whitespace-pre-wrap wrap-anywhere">
        <span className="sr-only">
          {style.label ? `${style.label} line ${side.lineNumber}: ` : `Line ${side.lineNumber}: `}
        </span>
        <DiffText side={side} />
      </span>
    </div>
  );
}

function DiffText({ side }: { side: DiffSide }) {
  if (!side.segments) {
    return side.text;
  }

  return side.segments.map((segment, index) => {
    if (segment.type === "removed") {
      return (
        <del key={index} className="rounded-sm bg-removed-bg text-removed-fg">
          {segment.text}
        </del>
      );
    }
    if (segment.type === "added") {
      return (
        <ins key={index} className="rounded-sm bg-added-bg text-added-fg">
          {segment.text}
        </ins>
      );
    }
    return <span key={index}>{segment.text}</span>;
  });
}
