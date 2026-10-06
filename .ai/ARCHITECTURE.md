# Architecture

## Frontend

Next.js App Router.

## Components

Use reusable components.

Example:

- Header
- TextEditor
- CompareToolbar
- ComparisonOptions
- DiffViewer
- ActionButtons
- EmptyState

## Business Logic

Comparison logic should be separated from UI components.

Put comparison-related logic inside:

lib/

Example:

lib/diff.ts

## Principles

- Keep components small.
- Avoid duplicated logic.
- Keep business logic outside UI components.
- Prefer reusable functions.
- Use TypeScript types.
- Avoid unnecessary dependencies.
- Keep the application client-side whenever possible.

## Data Flow

User Input
    ↓
TextEditor
    ↓
CompareToolbar
    ↓
Diff Engine
    ↓
DiffViewer