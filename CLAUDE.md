# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Purpose

Media management admin interface — binary file handling, media catalogs, and image/video upload workflows. This is the primary domain focus; keep it in mind when choosing libraries and designing components.

## Commands

Package manager: `pnpm`

```bash
pnpm dev          # dev server with HMR
pnpm build        # tsc type-check + vite build
pnpm lint         # eslint across all .ts/.tsx
pnpm preview      # serve the production build locally
```

No test runner is configured yet.

## Stack

- **React 19** + **TypeScript ~6** + **Vite 8**
- `@vitejs/plugin-react` — uses Oxc (not SWC/Babel)
- ESLint 10 with `typescript-eslint`, `eslint-plugin-react-hooks`, `eslint-plugin-react-refresh`

## TypeScript Config Constraints

`tsconfig.app.json` enforces:
- `noUnusedLocals` / `noUnusedParameters` — unused variables are errors
- `erasableSyntaxOnly: true` — **no enums or namespaces**; use `const` objects or union types instead
- `verbatimModuleSyntax: true` — use `import type` for type-only imports

## Architecture

Currently at the scaffold stage — `src/App.tsx` is the single entry point mounted via `src/main.tsx`. No router, state management, or UI library is wired up yet.

When the app grows, prefer:
- Route-based code splitting (lazy + Suspense) given media-heavy payloads
- Chunked / resumable upload patterns for large binary files — avoid buffering entire files in memory
- Keeping upload logic in dedicated hooks/services, not embedded in components
