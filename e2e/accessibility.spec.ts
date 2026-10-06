import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import {
  compare,
  jsonError,
  modifiedEditor,
  SAMPLE_MODIFIED,
  SAMPLE_ORIGINAL,
  selectMode,
} from "./helpers";

async function expectNoViolations(page: Page) {
  const { violations } = await new AxeBuilder({ page }).analyze();
  const details = violations.flatMap((violation) =>
    violation.nodes.map(
      (node) => `${violation.id}: ${node.target.join(" ")} — ${node.failureSummary}`,
    ),
  );
  expect(details).toEqual([]);
}

for (const colorScheme of ["light", "dark"] as const) {
  test.describe(`${colorScheme} theme`, () => {
    test.use({ colorScheme });

    test("empty page has no accessibility violations", async ({ page }) => {
      await page.goto("/");
      await expectNoViolations(page);
    });

    test("JSON error state has no accessibility violations", async ({ page }) => {
      await page.goto("/");
      await modifiedEditor(page).fill("{bad");
      await page.getByRole("button", { name: "Format modified text as JSON" }).click();
      await expect(jsonError(page)).toBeVisible();
      await expectNoViolations(page);
    });

    test("word-mode result has no accessibility violations", async ({ page }) => {
      await page.goto("/");
      await selectMode(page, "Words");
      await compare(page, SAMPLE_ORIGINAL, SAMPLE_MODIFIED);
      await expect(page.locator("ins").first()).toBeVisible();
      // Hover states must keep their contrast too.
      await page.getByRole("button", { name: "Compare", exact: true }).hover();
      await expectNoViolations(page);
    });
  });
}
