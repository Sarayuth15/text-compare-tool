import { readFile } from "node:fs/promises";
import { expect, test } from "@playwright/test";
import {
  button,
  compare,
  fillTexts,
  jsonError,
  modifiedEditor,
  originalEditor,
  summary,
} from "./helpers";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
});

test("formats valid JSON", async ({ page }) => {
  await originalEditor(page).fill('{"name":"Ada","tags":["math"]}');
  await page.getByRole("button", { name: "Format original text as JSON" }).click();

  await expect(originalEditor(page)).toHaveValue(
    '{\n  "name": "Ada",\n  "tags": [\n    "math"\n  ]\n}',
  );
});

test("shows an inline error for invalid JSON and clears it on edit", async ({ page }) => {
  await modifiedEditor(page).fill("{oops}");
  await page.getByRole("button", { name: "Format modified text as JSON" }).click();

  const error = jsonError(page);
  await expect(error).toContainText("Invalid JSON");
  await expect(modifiedEditor(page)).toHaveValue("{oops}");
  await expect(modifiedEditor(page)).toHaveAttribute("aria-invalid", "true");

  await modifiedEditor(page).fill('{"ok":true}');
  await expect(error).toHaveCount(0);
});

test("switches the two texts", async ({ page }) => {
  await fillTexts(page, "left", "right");
  await button(page, "Switch texts").click();

  await expect(originalEditor(page)).toHaveValue("right");
  await expect(modifiedEditor(page)).toHaveValue("left");
});

test("clears texts and the result", async ({ page }) => {
  await compare(page, "a", "b");
  await button(page, "Clear all").click();

  await expect(originalEditor(page)).toHaveValue("");
  await expect(modifiedEditor(page)).toHaveValue("");
  await expect(page.getByText("No comparison yet")).toBeVisible();
  await expect(button(page, "Clear all")).toBeDisabled();
  await expect(button(page, "Switch texts")).toBeDisabled();
});

test("copies the result as text", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await compare(page, "a\nb", "a\nc");
  await button(page, "Copy result").click();

  await expect(button(page, "Copied")).toBeVisible();
  // The OS clipboard may convert line endings (CRLF on Windows).
  const copied = await page.evaluate(() => navigator.clipboard.readText());
  expect(copied.replace(/\r\n/g, "\n")).toBe("--- Original\n+++ Modified\n  a\n- b\n+ c");
  await expect(button(page, "Copy result")).toBeVisible({ timeout: 4000 });
});

test("reports a failed copy", async ({ page }) => {
  await compare(page, "a", "b");
  await page.evaluate(() => {
    navigator.clipboard.writeText = () => Promise.reject(new Error("denied"));
  });
  await button(page, "Copy result").click();

  await expect(button(page, "Copy failed")).toBeVisible();
});

test("downloads the result as a text file", async ({ page }) => {
  await compare(page, "a\nb", "a\nc");
  await expect(summary(page)).toContainText("1 changed");

  const [download] = await Promise.all([
    page.waitForEvent("download"),
    button(page, "Download result").click(),
  ]);

  expect(download.suggestedFilename()).toBe("text-compare-result.txt");
  const content = await readFile(await download.path(), "utf8");
  expect(content).toBe("--- Original\n+++ Modified\n  a\n- b\n+ c");
});
