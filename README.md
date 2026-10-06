# Text Compare

A fast, private text diff tool. Paste two versions of a text and see what was
added, removed and changed, side by side.

All comparison happens in the browser. Text is never sent to a server.

## Features

- Compare by **lines** or by **words** (word mode highlights the exact changes inside each line)
- **Ignore whitespace** and **ignore case** options
- Side-by-side result on desktop, stacked on mobile, with line numbers and
  `+` / `−` markers so differences don't rely on colour alone
- Result statistics: added, removed, changed and unchanged lines
- **Format JSON**, **Switch texts**, **Clear all**
- **Copy** or **Download** the result as a unified-diff style text file
- Light and dark themes; keyboard and screen reader friendly
- Handles large inputs: results render in batches of 2,000 rows

## Getting started

Requires Node.js 20.9 or later.

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the development server |
| `npm run build` | Create a production build |
| `npm run start` | Serve the production build |
| `npm run lint` | Run ESLint |
| `npm test` | Run unit tests, then end-to-end tests |
| `npm run test:unit` | Run unit tests (Vitest) |
| `npm run test:unit:watch` | Run unit tests in watch mode |
| `npm run test:e2e` | Run end-to-end tests (Playwright) |

## Testing

**Unit tests** live next to the code in `lib/*.test.ts` and cover the diff
engine, JSON formatting and result export.

**End-to-end tests** live in `e2e/`. They cover the compare flow, the utility
buttons, responsive layouts and accessibility (axe-core scans in light and dark
themes). Playwright builds the app and serves it on port 3100 automatically.
If a server is already running on that port, it is reused outside CI.

Before running end-to-end tests for the first time, install the browser:

```bash
npx playwright install chromium
```

## Project structure

```
app/            Next.js App Router entry (layout, page, global styles)
components/     UI components; TextCompare holds the page state
lib/            Comparison logic, kept separate from the UI
  sequence-diff.ts   Myers diff algorithm (linear space, time-limited)
  diff.ts            Line/word comparison, options and statistics
  diff-export.ts     Plain-text export for Copy and Download
  format-json.ts     JSON pretty-printing
e2e/            Playwright end-to-end tests
.ai/            Project guidelines for AI-assisted development
```

## How the comparison works

`lib/sequence-diff.ts` implements Myers' O(ND) diff algorithm using the
linear-space "middle snake" variant. If a comparison takes longer than one
second, the remaining section is reported as a plain removal plus addition.
That result is still correct, just less precise, and it keeps the page
responsive.

`lib/diff.ts` splits text into lines (or words), applies the ignore options to
the comparison keys only, and pairs adjacent removed and added lines into
"changed" lines. The text shown in the result is always the original, unchanged.

## Tech stack

Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4, Vitest and
Playwright. The app has no runtime dependencies beyond Next.js and React.
