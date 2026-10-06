import { expect, test, type Page } from "@playwright/test";
import { button, compare, modifiedEditor, originalEditor, SAMPLE_MODIFIED, SAMPLE_ORIGINAL } from "./helpers";

async function hasHorizontalOverflow(page: Page) {
  return page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  );
}

async function sameRow(page: Page, first: string, second: string) {
  const [a, b] = await Promise.all([
    page.locator(first).first().boundingBox(),
    page.locator(second).first().boundingBox(),
  ]);
  return Math.abs((a?.y ?? 0) - (b?.y ?? 0)) < 2;
}

test.describe("phone", () => {
  test.use({ viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true });

  test("stacks editors, enlarges touch targets and avoids zoom on focus", async ({ page }) => {
    await page.goto("/");
    await compare(page, SAMPLE_ORIGINAL, SAMPLE_MODIFIED);

    expect(await hasHorizontalOverflow(page)).toBe(false);
    expect(await sameRow(page, "#original-text", "#modified-text")).toBe(false);
    await expect(originalEditor(page)).toHaveCSS("font-size", "16px");

    for (const name of ["Switch texts", "Clear all", "Compare", "Copy result"]) {
      const box = await button(page, name).boundingBox();
      expect(box?.height, name).toBeGreaterThanOrEqual(36);
    }
  });
});

test.describe("tablet", () => {
  test.use({ viewport: { width: 768, height: 1024 }, isMobile: true, hasTouch: true });

  test("shows editors side by side", async ({ page }) => {
    await page.goto("/");
    await compare(page, SAMPLE_ORIGINAL, SAMPLE_MODIFIED);

    expect(await hasHorizontalOverflow(page)).toBe(false);
    expect(await sameRow(page, "#original-text", "#modified-text")).toBe(true);
    await expect(modifiedEditor(page)).toHaveCSS("font-size", "16px");
  });
});

test.describe("desktop", () => {
  test.use({ viewport: { width: 1280, height: 900 } });

  test("shows editors and the diff side by side", async ({ page }) => {
    await page.goto("/");
    await compare(page, SAMPLE_ORIGINAL, SAMPLE_MODIFIED);

    expect(await hasHorizontalOverflow(page)).toBe(false);
    expect(await sameRow(page, "#original-text", "#modified-text")).toBe(true);
    const removed = page.getByText("Changed line 1:").first();
    const added = page.getByText("Changed line 1:").last();
    const [removedBox, addedBox] = await Promise.all([
      removed.locator("..").boundingBox(),
      added.locator("..").boundingBox(),
    ]);
    expect(Math.abs((removedBox?.y ?? 0) - (addedBox?.y ?? 0))).toBeLessThan(2);
  });
});
