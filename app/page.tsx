import Header from "@/components/Header";
import TextCompare from "@/components/TextCompare";

export default function Home() {
  return (
    <>
      <Header />

      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-4 py-6 sm:px-6">
        <TextCompare />
      </main>

      <footer className="border-t border-border bg-surface">
        <p className="mx-auto w-full max-w-7xl px-4 py-3 text-xs text-muted sm:px-6">
          Your text is compared locally in your browser and never leaves your
          device.
        </p>
      </footer>
    </>
  );
}
