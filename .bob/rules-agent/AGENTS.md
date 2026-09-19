# AGENTS.md

This file provides guidance to agents when working with code in this repository.

## Non-Obvious Coding Rules

### Never write to `data/` or `storage/` from new routes without accounting for Vercel's read-only fs
Every new endpoint that calls `db.save()`, `persistInsights()`, `saveKb()`, or `persistAuditLogs()` will silently fail on Vercel. Flag this in any new feature.

### Add new DB collections by extending `DatabaseSchema` in `server/db.ts` AND `src/types.ts`
The interface in `db.ts` (`DatabaseSchema`, line ~45) and the types in `src/types.ts` are two separate files that must stay in sync. Adding a field to one without the other causes TypeScript errors at `bun run lint`.

### AI insight services follow an identical pattern — copy exactly
`InfrastructureAIService`, `DriverSafetyAIService`, and `IncidentAIService` all share the same structure: constructor → `loadPersistedInsights()` → in-memory `Map` cache → `persistInsights()` on every mutation. New AI insight services must follow this exact shape.

### `broadcastEvent()` must be called after `db.save()` in every mutating route
Pattern in `server.ts`: mutate DB, call `db.save()` (implicit inside the DB method), then call `broadcastEvent(eventType, data)`. Reversing order causes stale data to be broadcast.

### `src/utils/faceCvEngine.ts` runs entirely in the browser (MediaPipe)
Do not import `faceCvEngine` in any server module — it depends on `@mediapipe/tasks-vision` which uses browser APIs. Similarly `src/utils/busInfraCvEngine.ts` and `src/utils/ninePointAudit.ts` are browser-only utilities.

### `navigatorService.ts` and `ragEngine.ts` require `.js` extensions on local imports
These two files use `from './db.js'` style. When editing imports inside them, keep `.js` extensions. All other server files use bare `from './db'`.

### PDF generation writes a side-effect file to `storage/reports/`
`exportService.ts` `generatePDFReport()` always tries to write `storage/reports/REP-XXXX.pdf` even when streaming the buffer back to the client. The write is wrapped in try/catch so failure is non-fatal, but do not remove it — it enables persistent report URLs at `/storage/reports/`.

### Gemini SDK model name
All Gemini calls use `gemini-2.5-flash` or `gemini-2.0-flash` — check existing `aiPipeline.ts` / `ragEngine.ts` calls before adding a new model name to stay consistent.
