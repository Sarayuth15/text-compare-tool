export type FormatJsonResult =
  | { ok: true; text: string }
  | { ok: false; error: string };

const INDENT = 2;

export function formatJson(text: string): FormatJsonResult {
  try {
    return { ok: true, text: JSON.stringify(JSON.parse(text), null, INDENT) };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return { ok: false, error: `Invalid JSON: ${message}` };
  }
}
