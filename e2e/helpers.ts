import type { Page } from "@playwright/test";

export const SAMPLE_ORIGINAL = [
  "function greet(name) {",
  '  return "Hello, " + name;',
  "}",
  "",
  "const users = ['Ada', 'Linus'];",
  "users.forEach(greet);",
  "// a removed comment line",
  "export default greet;",
].join("\n");

export const SAMPLE_MODIFIED = [
  "function greet(name, greeting) {",
  '  return greeting + ", " + name;',
  "}",
  "",
  "const users = ['Ada', 'Linus', 'Grace'];",
  "users.forEach((u) => greet(u, 'Hi'));",
  "export default greet;",
  "// a newly added trailing line that is long enough to wrap on narrow screens",
].join("\n");

export function originalEditor(page: Page) {
  return page.getByLabel("Original text", { exact: true });
}

export function modifiedEditor(page: Page) {
  return page.getByLabel("Modified text", { exact: true });
}

export function button(page: Page, name: string) {
  return page.getByRole("button", { name, exact: true });
}

export function summary(page: Page) {
  return page.getByRole("list", { name: "Comparison summary" });
}

/** The JSON error for an editor (Next.js also renders its own route announcer alert). */
export function jsonError(page: Page) {
  return page.getByRole("alert").filter({ hasText: "Invalid JSON" });
}

/** Picks a mode by its visible label, as a user would; the radio itself is visually hidden. */
export async function selectMode(page: Page, mode: "Lines" | "Words") {
  await page.locator("label", { hasText: new RegExp(`^${mode}$`) }).click();
}

/**
 * Sets an editor's value the way a paste does. Playwright's `fill` inserts text
 * through a path that gets very slow for multi-thousand-line inputs in Chromium.
 */
export async function pasteText(page: Page, editor: "original" | "modified", text: string) {
  await page.locator(`#${editor}-text`).evaluate((element, value) => {
    const textarea = element as HTMLTextAreaElement;
    const setValue = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value")?.set;
    setValue?.call(textarea, value);
    textarea.dispatchEvent(new Event("input", { bubbles: true }));
  }, text);
}

export async function fillTexts(page: Page, original: string, modified: string) {
  await originalEditor(page).fill(original);
  await modifiedEditor(page).fill(modified);
}

export async function compare(page: Page, original: string, modified: string) {
  await fillTexts(page, original, modified);
  await button(page, "Compare").click();
}

export function numberedLines(count: number, edit?: (index: number) => boolean) {
  return Array.from({ length: count }, (_, i) =>
    edit?.(i) ? `line ${i} edited` : `line ${i}`,
  ).join("\n");
}
