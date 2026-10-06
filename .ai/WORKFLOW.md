# AI Development Workflow

The AI agent must follow this workflow for every task.

## Phase 1 — Understand

Before coding:

1. Read CLAUDE.md.
2. Read relevant files under .ai/.
3. Inspect the existing project structure.
4. Understand the current implementation.
5. Identify files that need to change.

Do not immediately start coding.

## Phase 2 — Plan

Create a short implementation plan.

The plan must contain:

- Goal
- Files to change
- New files
- Main implementation steps
- Testing steps

## Phase 3 — Implement

Implement the smallest clean solution.

Rules:

- Follow project architecture.
- Follow coding rules.
- Reuse existing components.
- Avoid unnecessary dependencies.
- Do not rewrite unrelated code.

## Phase 4 — Verify

Run:

npm run lint

and:

npm run build

Fix all errors.

## Phase 5 — Test

Test:

- Happy path
- Empty input
- Invalid input
- Large input
- Mobile UI
- Desktop UI
- Edge cases

## Phase 6 — Review

Before finishing:

- Check for duplicated code.
- Check TypeScript errors.
- Check accessibility.
- Check responsive behavior.
- Check performance.
- Check security.
- Check whether unrelated files were modified.

## Phase 7 — Report

Return:

### Completed

List implemented changes.

### Files Changed

List modified files.

### Tests

List commands executed.

### Issues

List remaining issues.

### Next Step

Suggest the next logical task.