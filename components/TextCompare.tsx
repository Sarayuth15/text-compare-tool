"use client";

import { useRef, useState } from "react";
import ActionButtons from "@/components/ActionButtons";
import Button from "@/components/Button";
import CompareToolbar from "@/components/CompareToolbar";
import DiffSummary from "@/components/DiffSummary";
import DiffViewer from "@/components/DiffViewer";
import EmptyState from "@/components/EmptyState";
import TextEditor from "@/components/TextEditor";
import {
  DEFAULT_COMPARE_OPTIONS,
  isSameOptions,
  type CompareOptions,
} from "@/lib/compare-options";
import { compareTexts, type DiffResult } from "@/lib/diff";
import { formatJson } from "@/lib/format-json";

type Side = "original" | "modified";

type SideValues<T> = Record<Side, T>;

interface Comparison {
  texts: SideValues<string>;
  options: CompareOptions;
  result: DiffResult;
}

const EMPTY_TEXTS: SideValues<string> = { original: "", modified: "" };
const NO_ERRORS: SideValues<string | null> = { original: null, modified: null };

const EDITORS: { side: Side; label: string; placeholder: string }[] = [
  {
    side: "original",
    label: "Original text",
    placeholder: "Paste or type the original text…",
  },
  {
    side: "modified",
    label: "Modified text",
    placeholder: "Paste or type the modified text…",
  },
];

export default function TextCompare() {
  const [texts, setTexts] = useState(EMPTY_TEXTS);
  const [jsonErrors, setJsonErrors] = useState(NO_ERRORS);
  const [options, setOptions] = useState<CompareOptions>(
    DEFAULT_COMPARE_OPTIONS,
  );
  const [comparison, setComparison] = useState<Comparison | null>(null);
  const resultRef = useRef<HTMLElement>(null);

  const hasAnyText = texts.original.length > 0 || texts.modified.length > 0;
  const canCompare = texts.original.length > 0 && texts.modified.length > 0;
  const isStale =
    comparison !== null &&
    (comparison.texts.original !== texts.original ||
      comparison.texts.modified !== texts.modified ||
      !isSameOptions(comparison.options, options));

  function updateText(side: Side, value: string) {
    setTexts((current) => ({ ...current, [side]: value }));
    setJsonErrors((current) => ({ ...current, [side]: null }));
  }

  function handleFormatJson(side: Side) {
    const formatted = formatJson(texts[side]);
    if (formatted.ok) {
      updateText(side, formatted.text);
    } else {
      setJsonErrors((current) => ({ ...current, [side]: formatted.error }));
    }
  }

  function handleCompare() {
    setComparison({
      texts,
      options,
      result: compareTexts(texts.original, texts.modified, options),
    });
    resultRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  function handleSwitch() {
    setTexts((current) => ({
      original: current.modified,
      modified: current.original,
    }));
    setJsonErrors((current) => ({
      original: current.modified,
      modified: current.original,
    }));
  }

  function handleClear() {
    setTexts(EMPTY_TEXTS);
    setJsonErrors(NO_ERRORS);
    setComparison(null);
  }

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {EDITORS.map((editor) => (
          <TextEditor
            key={editor.side}
            id={`${editor.side}-text`}
            label={editor.label}
            value={texts[editor.side]}
            placeholder={editor.placeholder}
            onChange={(value) => updateText(editor.side, value)}
            error={jsonErrors[editor.side]}
            actions={
              <Button
                size="sm"
                onClick={() => handleFormatJson(editor.side)}
                disabled={texts[editor.side].trim().length === 0}
                aria-label={`Format ${editor.label.toLowerCase()} as JSON`}
              >
                Format JSON
              </Button>
            }
          />
        ))}
      </div>

      <CompareToolbar
        options={options}
        onOptionsChange={setOptions}
        canCompare={canCompare}
        onCompare={handleCompare}
        canSwitch={hasAnyText}
        onSwitch={handleSwitch}
        canClear={hasAnyText || comparison !== null}
        onClear={handleClear}
      />

      <section
        ref={resultRef}
        aria-labelledby="result-heading"
        className="flex scroll-mt-4 flex-col gap-2"
      >
        {/* Below `lg` the summary drops to its own row under the heading and actions. */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <h2 id="result-heading" className="mr-auto text-sm font-medium">
            Result
          </h2>
          <div role="status" className="order-last w-full lg:order-none lg:w-auto">
            {comparison && <DiffSummary stats={comparison.result.stats} />}
          </div>
          {comparison && <ActionButtons result={comparison.result} />}
        </div>

        {isStale && (
          <p className="text-xs text-muted">
            The text or options have changed. Select Compare to update the
            result.
          </p>
        )}

        <ComparisonResult result={comparison?.result ?? null} />
      </section>
    </div>
  );
}

function ComparisonResult({ result }: { result: DiffResult | null }) {
  if (!result) {
    return (
      <EmptyState
        title="No comparison yet"
        description="Add text to both editors, then select Compare to see what was added, removed, and changed."
      />
    );
  }

  if (result.identical) {
    return (
      <EmptyState
        title="No differences found"
        description="Both texts match with the current comparison options."
      />
    );
  }

  return <DiffViewer lines={result.lines} />;
}
