import { expect, test } from "@playwright/test";
import {
  button,
  compare,
  fillTexts,
  modifiedEditor,
  numberedLines,
  pasteText,
  SAMPLE_MODIFIED,
  SAMPLE_ORIGINAL,
  selectMode,
  summary,
} from "./helpers";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
});

test("shows the empty state and disables Compare until both texts exist", async ({ page }) => {
  await expect(page.getByText("No comparison yet")).toBeVisible();
  await expect(button(page, "Compare")).toBeDisabled();

  await page.getByLabel("Original text", { exact: true }).fill("only one side");
  await expect(button(page, "Compare")).toBeDisabled();

  await modifiedEditor(page).fill("other side");
  await expect(button(page, "Compare")).toBeEnabled();
});

test("compares by lines and reports statistics", async ({ page }) => {
  await compare(page, SAMPLE_ORIGINAL, SAMPLE_MODIFIED);

  await expect(summary(page)).toContainText("1 added");
  await expect(summary(page)).toContainText("1 removed");
  await expect(summary(page)).toContainText("4 changed");
  await expect(summary(page)).toContainText("3 unchanged");
  await expect(page.getByText("Removed line 7:")).toBeAttached();
  await expect(page.getByText("Added line 8:")).toBeAttached();
  await expect(page.getByText("Changed line 5:")).toHaveCount(2);
  await expect(page.locator("del, ins")).toHaveCount(0);
});

test("highlights changed words in word mode", async ({ page }) => {
  await selectMode(page, "Words");
  await expect(page.getByRole("radio", { name: "Words" })).toBeChecked();
  await compare(page, "the quick brown fox", "the slow brown fox");

  await expect(page.locator("del")).toHaveText("quick");
  await expect(page.locator("ins")).toHaveText("slow");
});

test("reports no differences when options make texts match", async ({ page }) => {
  await page.getByRole("checkbox", { name: "Ignore case" }).check();
  await compare(page, "Hello World", "hello world");

  await expect(page.getByText("No differences found")).toBeVisible();
});

test("flags a stale result until Compare runs again", async ({ page }) => {
  const staleNote = page.getByText("Select Compare to update the result.");
  await compare(page, "a", "b");
  await expect(staleNote).toBeHidden();

  await modifiedEditor(page).fill("c");
  await expect(staleNote).toBeVisible();

  await button(page, "Compare").click();
  await expect(staleNote).toBeHidden();
});

test("runs Compare from the keyboard", async ({ page }) => {
  await fillTexts(page, "a", "b");
  await button(page, "Compare").focus();
  await page.keyboard.press("Enter");

  await expect(summary(page)).toContainText("1 changed");
});

test("renders large results in batches", async ({ page }) => {
  const original = numberedLines(5000);
  const modified = numberedLines(5000, (i) => i % 100 === 0);
  await pasteText(page, "original", original);
  await pasteText(page, "modified", modified);
  await button(page, "Compare").click();

  const lastLine = page.getByText("Line 5000: line 4999", { exact: true });
  await expect(page.getByText("Showing 2,000 of 5,000 lines")).toBeVisible();
  await expect(lastLine).toHaveCount(0);

  await button(page, "Show 2,000 more").click();
  await expect(page.getByText("Showing 4,000 of 5,000 lines")).toBeVisible();

  await button(page, "Show all").click();
  await expect(page.getByText(/^Showing/)).toHaveCount(0);
  await expect(lastLine.first()).toBeAttached();
});
