import type { CompareMode, CompareOptions } from "@/lib/compare-options";

interface ComparisonOptionsProps {
  options: CompareOptions;
  onChange: (options: CompareOptions) => void;
}

const MODES: { value: CompareMode; label: string }[] = [
  { value: "lines", label: "Lines" },
  { value: "words", label: "Words" },
];

const TOGGLES: {
  key: "ignoreWhitespace" | "ignoreCase";
  label: string;
}[] = [
  { key: "ignoreWhitespace", label: "Ignore whitespace" },
  { key: "ignoreCase", label: "Ignore case" },
];

export default function ComparisonOptions({
  options,
  onChange,
}: ComparisonOptionsProps) {
  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
      <fieldset className="flex items-center gap-2">
        <legend className="sr-only">Compare by</legend>
        <span aria-hidden="true" className="text-sm text-muted">
          Compare by
        </span>
        <div className="flex rounded-base border border-border p-0.5">
          {MODES.map((mode) => (
            <label key={mode.value} className="cursor-pointer">
              <input
                type="radio"
                name="compare-mode"
                value={mode.value}
                checked={options.mode === mode.value}
                onChange={() => onChange({ ...options, mode: mode.value })}
                className="peer sr-only"
              />
              <span className="block rounded-[3px] px-3 py-1 text-sm pointer-coarse:py-2 text-muted transition-colors peer-checked:bg-accent peer-checked:text-accent-foreground peer-focus-visible:outline-2 peer-focus-visible:outline-offset-1 peer-focus-visible:outline-accent hover:text-foreground peer-checked:hover:text-accent-foreground">
                {mode.label}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      {TOGGLES.map((toggle) => (
        <label
          key={toggle.key}
          className="flex cursor-pointer items-center gap-2 text-sm pointer-coarse:py-2"
        >
          <input
            type="checkbox"
            checked={options[toggle.key]}
            onChange={(event) =>
              onChange({ ...options, [toggle.key]: event.target.checked })
            }
            className="size-4 cursor-pointer accent-accent pointer-coarse:size-5"
          />
          {toggle.label}
        </label>
      ))}
    </div>
  );
}
