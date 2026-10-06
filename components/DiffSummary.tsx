import type { DiffStats } from "@/lib/diff";

interface DiffSummaryProps {
  stats: DiffStats;
}

const ITEMS: {
  key: keyof DiffStats;
  symbol: string;
  label: string;
  className: string;
}[] = [
  { key: "added", symbol: "+", label: "added", className: "bg-added-bg text-added-fg" },
  { key: "removed", symbol: "−", label: "removed", className: "bg-removed-bg text-removed-fg" },
  { key: "changed", symbol: "±", label: "changed", className: "bg-changed-bg text-changed-fg" },
  { key: "unchanged", symbol: "=", label: "unchanged", className: "bg-background text-muted" },
];

export default function DiffSummary({ stats }: DiffSummaryProps) {
  return (
    <ul className="flex flex-wrap gap-2" aria-label="Comparison summary">
      {ITEMS.map((item) => (
        <li
          key={item.key}
          className={`rounded-base px-2 py-0.5 text-xs font-medium tabular-nums ${item.className}`}
        >
          <span aria-hidden="true">{item.symbol} </span>
          {stats[item.key]} {item.label}
        </li>
      ))}
    </ul>
  );
}
