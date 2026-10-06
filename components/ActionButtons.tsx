"use client";

import { useEffect, useRef, useState } from "react";
import Button from "@/components/Button";
import type { DiffResult } from "@/lib/diff";
import { formatDiffAsText } from "@/lib/diff-export";
import { downloadTextFile } from "@/lib/download";

interface ActionButtonsProps {
  result: DiffResult;
}

type CopyStatus = "idle" | "copied" | "failed";

const DOWNLOAD_FILENAME = "text-compare-result.txt";
const STATUS_RESET_MS = 2000;

const COPY_LABELS: Record<CopyStatus, string> = {
  idle: "Copy result",
  copied: "Copied",
  failed: "Copy failed",
};

export default function ActionButtons({ result }: ActionButtonsProps) {
  const [copyStatus, setCopyStatus] = useState<CopyStatus>("idle");
  const resetTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(resetTimer.current), []);

  function showCopyStatus(status: CopyStatus) {
    setCopyStatus(status);
    clearTimeout(resetTimer.current);
    resetTimer.current = setTimeout(() => setCopyStatus("idle"), STATUS_RESET_MS);
  }

  async function handleCopy() {
    try {
      if (!navigator.clipboard) {
        throw new Error("Clipboard API unavailable");
      }
      await navigator.clipboard.writeText(formatDiffAsText(result));
      showCopyStatus("copied");
    } catch {
      showCopyStatus("failed");
    }
  }

  function handleDownload() {
    downloadTextFile(DOWNLOAD_FILENAME, formatDiffAsText(result));
  }

  return (
    <div className="flex gap-2">
      <Button size="sm" onClick={handleCopy} className="min-w-24">
        {COPY_LABELS[copyStatus]}
      </Button>
      <Button size="sm" onClick={handleDownload}>
        Download result
      </Button>
      <span role="status" className="sr-only">
        {copyStatus === "idle" ? "" : COPY_LABELS[copyStatus]}
      </span>
    </div>
  );
}
