import Button from "@/components/Button";
import ComparisonOptions from "@/components/ComparisonOptions";
import type { CompareOptions } from "@/lib/compare-options";

interface CompareToolbarProps {
  options: CompareOptions;
  onOptionsChange: (options: CompareOptions) => void;
  canCompare: boolean;
  onCompare: () => void;
  canSwitch: boolean;
  onSwitch: () => void;
  canClear: boolean;
  onClear: () => void;
}

export default function CompareToolbar({
  options,
  onOptionsChange,
  canCompare,
  onCompare,
  canSwitch,
  onSwitch,
  canClear,
  onClear,
}: CompareToolbarProps) {
  return (
    <div className="flex flex-col gap-4 rounded-base border border-border bg-surface px-3 py-3 lg:flex-row lg:items-center lg:justify-between">
      <ComparisonOptions options={options} onChange={onOptionsChange} />
      <div className="flex flex-wrap gap-2">
        <Button onClick={onSwitch} disabled={!canSwitch}>
          Switch texts
        </Button>
        <Button onClick={onClear} disabled={!canClear}>
          Clear all
        </Button>
        <Button
          variant="primary"
          onClick={onCompare}
          disabled={!canCompare}
          className="flex-1 lg:flex-none"
        >
          Compare
        </Button>
      </div>
    </div>
  );
}
