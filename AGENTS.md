# AGENTS.md

This file provides guidance to agents when working with code in this repository.

## Stack
- **Frontend**: React 19 + TypeScript, Vite 6 SPA, Tailwind CSS v4 (`@import "tailwindcss"` — no `@tailwind` directives)
- **Backend**: Express 4 + TypeScript, single `server.ts` entry at project root; all service modules live in `server/`
- **Package manager**: Bun (`bun.lock`); npm scripts also work

## Commands
```bash
bun run dev      # tsx server.ts — Express + Vite dev server in one process
bun run build    # vite build && esbuild server.ts → dist/server.cjs
bun run start    # node dist/server.cjs (production)
bun run lint     # tsc --noEmit (no test runner exists)
```
There are **no tests**. `bun run lint` is the only validation command.

## Critical Architecture Facts

### Single shared type file
All types (frontend + backend) live in `src/types.ts`. Server modules import from `../src/types` — not from a separate backend types package.

### Two import styles in `server/` — do not mix
- Most server files use bare specifiers: `from './db'`
- `navigatorService.ts` and `ragEngine.ts` use `.js` extensions: `from './db.js'`  
  Both work with esbuild; add `.js` only when editing those two files.

### Database is a singleton in-process JSON store
`server/db.ts` exports a single `db` instance (`export const db = new PersistentDatabase()`). All mutations call `db.save()` which debounces and writes `data/solvofin_db.json` atomically (write to `.tmp` then rename). Never call `saveImmediate()` directly from routes.

### All persistence writes happen at `process.cwd()`
- `data/` — six JSON files (DB + AI insight caches + RAG KB + audit log)
- `storage/uploads/` — multer media uploads
- `public/storage/uploads/` — citizen photo uploads (separate path!)
- `storage/reports/` — PDF cache side-effect from `exportService.generatePDFReport()`

### Gemini client is lazily initialized
`server/aiPipeline.ts` checks `GEMINI_API_KEY !== 'MY_GEMINI_API_KEY'` before constructing the client. If the key is missing or equals the placeholder string, the client returns `null` and AI features degrade gracefully.

### Real-time events use Server-Sent Events, not WebSockets
`broadcastEvent()` in `server.ts` pushes to a `Set<express.Response>` (`sseClients`). Frontend consumers: `GovernmentAlertsHubView` and `AnalysisProgressModal` via `new EventSource(...)`.

## Code Style Conventions

### Severity / health badge colors
Never hard-code Tailwind color classes for severity or health. Always use helpers from `src/utils.ts`:
- `getSeverityBadgeColor(severity)` → `{ bg, text, border }` for `CRITICAL / HIGH / MEDIUM / LOW`
- `getHealthBadgeColor(rating)` → same shape for `EXCELLENT / GOOD / MODERATE / POOR / CRITICAL`

### Date and file-size formatting
Use `formatDate(isoString)` and `formatBytes(bytes)` from `src/utils.ts` — not inline `new Date().toLocaleString()` or manual KB/MB math.

### All frontend API calls use relative paths
`fetch('/api/...')` — no base URL, no axios. Vite proxies to Express in dev; in prod Express serves both.

### Component file naming
PascalCase `.tsx` files, one component per file, named identically to the export (e.g. `CitizenPortalView.tsx` exports `CitizenPortalView`).

### ID prefixes (must match existing patterns)
Entities use typed prefixes: `MEDIA-`, `DEF-`, `WO-`, `CIT-`, `ALT-`, `BUS-REP-`, `DOC-KB-`, `AUDIT-REP-`, `USR-`. Seed IDs use fixed strings (e.g. `MEDIA-00101`); runtime IDs use `Date.now()` slices.

## Demo credentials (hardcoded in `server/db.ts` `authenticate()`)
- Government: `gov_admin` / `admin123` (also accepts `government` / `visakha_roads_2025`)
- Citizen: `citizen_vizag` / `citizen123` (also accepts `citizen` / `password`)
- Auth does **not** verify passwords against a hash — it is plain string comparison.

## GPS / location defaults
Default corridor is `{ lat: 17.7342, lng: 83.3248 }` (Visakhapatnam NH-16 Sector 4). All location fallbacks in upload endpoints and `UploadSection.tsx` presets reference this coordinate system (Visakhapatnam / GVMC region).
