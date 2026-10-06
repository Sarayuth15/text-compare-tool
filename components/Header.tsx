export default function Header() {
  return (
    <header className="border-b border-border bg-surface">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <h1 className="text-lg font-semibold tracking-tight">Text Compare</h1>
        <p className="hidden text-sm text-muted sm:block">
          Find differences between two texts
        </p>
      </div>
    </header>
  );
}
