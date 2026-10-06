interface EmptyStateProps {
  title: string;
  description: string;
}

export default function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-1 rounded-base border border-dashed border-border px-4 py-10 text-center">
      <p className="text-sm font-medium">{title}</p>
      <p className="max-w-md text-sm text-muted">{description}</p>
    </div>
  );
}
