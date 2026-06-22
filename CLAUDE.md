# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Read the AGENTS.md files first

Detailed per-project conventions live in `AGENTS.md` files — read the relevant one before editing. They are the source of truth for style and rules; this file covers the cross-cutting architecture and commands.

- `AGENTS.md` (root) — repo overview
- `codedrift-frontend/AGENTS.md` — frontend stack + rules
- `codedrift-backend/AGENTS.md` — backend stack + rules

Key rules from those files worth repeating: don't install packages without explicit permission; `kebab-case` filenames, `camelCase` vars, `PascalCase` types; `@/` (frontend) / `@types` (backend) import conventions; explicit return types; keep lines under 120 chars (aim for 80); after backend endpoint changes, create/update the Bruno collection under `api-collection/Codedrift`.

## Repository layout

Codedrift is a code-intelligence / diff-review app. There is **no root `package.json`** — the two apps are developed and run independently from their own directories.

- `codedrift-backend/` — Node + Fastify + TypeScript API. Reads a target git repo via `simple-git`, computes diffs (`GET /diff`), registers repositories (`POST /addRepository`), and persists them in a local SQLite database (`better-sqlite3`).
- `codedrift-frontend/` — React 19 + Vite + TanStack Router/Query + Tailwind v4 + Shadcn UI. Renders the diff review UI.
- `api-collection/Codedrift/` — Bruno (OpenCollection) API collection; keep in sync with backend endpoints.

## Commands

### Backend (`cd codedrift-backend`, Node >= 22)
- `pnpm dev` — `tsx --watch src/main.ts`, server on port **3000**
- `pnpm build` — `tsc`
- `pnpm typecheck` — `tsc --noEmit`
- `pnpm start` — `node dist/main.js`
- No test runner is configured. Lint via `eslint .`; Prettier runs on pre-commit (husky + lint-staged).

### Frontend (`cd codedrift-frontend`)
- `pnpm dev` — Vite dev server
- `pnpm build` — `tsc -b && vite build`
- `pnpm lint` — `eslint .`
- `pnpm preview` — preview production build
- No test runner. Prettier runs on pre-commit. After changes, the frontend AGENTS.md asks for `tsc` + prettier; do not run vite/the browser to check visuals unless asked.

## Architecture & data flow

The backend operates on a **live git repository on disk**: diff/git operations are stateless and re-run per request. Registered repositories are persisted in a local **SQLite** database (`better-sqlite3`) at `~/.config/codedrift/codedrift.db`, opened at startup by `src/db/database.ts` — which creates the config dir, sets the `journal_mode=WAL` / `foreign_keys=ON` / `busy_timeout=5000` pragmas, and creates the `repositories` table. Data access goes through small stores in `src/db/` (e.g. `repository-store.ts`).

1. The target repo and refs being compared are **hardcoded** in `codedrift-backend/src/utils/temp-repo-info.ts` (`REPOSITORY_PATH`, `DIFF_BASE_REF`, `DIFF_HEAD_REF`). This is temporary scaffolding — the `/diff/select` frontend route is the eventual place to choose branches. Update this file to point at a different repo/refs.
2. `src/services/diff-service.ts` shells git through `simple-git`, parses raw diff output, normalizes paths, classifies each file (added / deleted / moved / changed), and fetches full file content at base and head. Shared shapes live in `src/@types/diff.ts` (`DiffFileData`, `DiffChangeType`).
3. `src/main.ts` is the Fastify entry point (CORS open). At startup it opens the SQLite DB (`import "./db/database.ts"`), serves `GET /diff` (raw `DiffFileData[]`, unwrapped), and registers per-resource route plugins via `fastify.register`.
4. **Routes** live in `src/routes/` as Fastify plugins (`FastifyPluginAsync`) — e.g. `repository-routes.ts` exports `repositoryRoutes`, registered in `main.ts`. `POST /addRepository` validates that the body `repositoryPath` is an absolute git repo (`src/services/repository-service.ts`, via `simple-git` `checkIsRepo`) and persists `(repositoryName, path)` to the `repositories` table through `src/db/repository-store.ts` (the `path` column is `UNIQUE`, so duplicates return 409).
5. New endpoints respond with the `ApiResponse<T>` wrapper `{ success, message, data }` from `src/@types/api-response.ts`; the legacy `GET /diff` stays unwrapped.
6. `src/tools/changeset-tools.ts` still wraps git operations as `ai`-SDK tools (list commits, hunks, file content at base/head), but the former `POST /tools/changeset/*` HTTP endpoints have been removed — the file is currently not wired into the server.

On the frontend:
1. TanStack Router uses **file-based routing** — routes live in `src/routes/`, and `src/routeTree.gen.ts` is **auto-generated** by `@tanstack/router-plugin` (do not edit by hand). Main routes: `/`, `/diff/select` (placeholder for branch selection), `/diff/view` (the main diff viewer).
2. `src/routes/diff/view/route.tsx` fetches `GET ${VITE_DIFF_API_URL}` (default `http://localhost:3000/diff`) via TanStack Query (`["diff"]`) using native `fetch` (no Axios). Configure the URL in `codedrift-frontend/.env`.
3. The result is pushed into the Zustand store `src/store/diff-view-store.ts` (`diffFiles`, `selectedFileId`). The store auto-selects the first file and keeps the selection valid across navigation.
4. The sidebar file tree (`src/components/sidebar/`) renders changed files grouped by directory with color-coded change types; clicking a file sets `selectedFileId`, and the main pane renders it with `@git-diff-view/react` (split view).

## Conventions not in AGENTS.md

- Frontend path alias `@/*` → `./src/*` is set in both `tsconfig` and `vite.config.ts`. The backend has no `paths` alias — `@types` there is a real directory (`src/@types/`) imported by relative path.
- Backend uses native ESM with `.ts` import extensions (`allowImportingTsExtensions`, `rewriteRelativeImportExtensions`); keep the `.ts` extension in relative imports.
- Shared/reused types go in the `@types` folder in each app.
- The `ai` SDK is wired for Anthropic/OpenAI/OpenRouter providers; when building or debugging LLM/tool features here, prefer the latest Claude models.
