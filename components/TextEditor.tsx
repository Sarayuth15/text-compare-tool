"use client";

import { useMemo, useRef, type ReactNode, type UIEvent } from "react";

interface TextEditorProps {
  id: string;
  label: string;
  value: string;
  placeholder?: string;
  onChange: (value: string) => void;
  /** Extra controls shown in the editor header. */
  actions?: ReactNode;
  error?: string | null;
}

/** Counts lines without allocating an array, so typing in huge texts stays cheap. */
function countLines(text: string): number {
  let count = 1;
  let index = text.indexOf("\n");
  while (index !== -1) {
    count++;
    index = text.indexOf("\n", index + 1);
  }
  return count;
}

export default function TextEditor({
  id,
  label,
  value,
  placeholder,
  onChange,
  actions,
  error,
}: TextEditorProps) {
  const gutterRef = useRef<HTMLDivElement>(null);
  const errorId = `${id}-error`;
  const lineCount = countLines(value);
  const lineNumbers = useMemo(
    () => Array.from({ length: lineCount }, (_, i) => i + 1).join("\n"),
    [lineCount],
  );

  function handleScroll(event: UIEvent<HTMLTextAreaElement>) {
    if (gutterRef.current) {
      gutterRef.current.scrollTop = event.currentTarget.scrollTop;
    }
  }

  return (
    <div className="flex min-w-0 flex-col rounded-base border border-border bg-surface">
      <div className="flex items-center justify-between gap-2 border-b border-border px-3 py-2">
        <label htmlFor={id} className="text-sm font-medium">
          {label}
        </label>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted">
            {lineCount} {lineCount === 1 ? "line" : "lines"}
          </span>
          {actions}
        </div>
      </div>
      {error && (
        <p
          id={errorId}
          role="alert"
          className="border-b border-border bg-removed-bg px-3 py-1.5 text-xs text-removed-fg"
        >
          {error}
        </p>
      )}
      {/* 16px text on touch devices stops iOS Safari from zooming in on focus. */}
      <div className="flex h-56 font-mono text-sm leading-6 pointer-coarse:text-base md:h-72 lg:h-96">
        <div
          ref={gutterRef}
          aria-hidden="true"
          className="shrink-0 overflow-hidden border-r border-border px-2 pt-2 pb-8 text-right text-muted select-none"
        >
          <pre className="font-mono">{lineNumbers}</pre>
        </div>
        <textarea
          id={id}
          value={value}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
          onScroll={handleScroll}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          wrap="off"
          spellCheck={false}
          autoCapitalize="off"
          autoComplete="off"
          autoCorrect="off"
          className="min-w-0 flex-1 resize-none overflow-auto bg-transparent px-3 py-2 outline-none placeholder:text-muted focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-inset"
        />
      </div>
    </div>
  );
}
