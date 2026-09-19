# AGENTS.md

This file provides guidance to agents when working with code in this repository.

## Non-Obvious Architectural Constraints

### Single-process, in-memory-first design
The Express server holds the entire application state in the `PersistentDatabase` instance. There is no shared cache layer, no Redis, and no process-level concurrency. All reads are from in-process memory; disk is only a persistence mechanism for restarts.

### Six separate JSON persistence files — each service owns one
`db.ts` → `solvofin_db.json` (all collections), `ragEngine.ts` → `solvofin_rag_kb.json`, `infrastructureAI.ts` → `solvofin_infra_insights.json`, `driverSafetyAI.ts` → `solvofin_driver_safety_insights.json`, `incidentAI.ts` → `solvofin_incident_insights.json`, `aiReportService.ts` → `solvofin_report_audits.json`. Each service independently loads/saves its own file. New AI services that need persistence must add a new file — do not add to `solvofin_db.json`.

### `src/types.ts` is the single source of truth for all domain types
Both the browser bundle (via Vite) and the server (via esbuild `--packages=external`) import from `../src/types`. Adding a new domain type in `server/` as a local interface breaks this contract and creates duplication.

### Navigator service is strictly read-only by design (non-negotiable)
`navigatorService.ts` is architecturally constrained to never mutate the database. All tool calls in `ALLOWLISTED_NAVIGATOR_TOOLS` map to read operations. Any plan to add write capability to the Navigator must be explicitly rejected — the design doc (`navigatorService.ts` header comment) states this as "NON-NEGOTIABLE PRINCIPLE #1".

### SSE fan-out is process-local and not horizontally scalable
`sseClients` in `server.ts` is a plain `Set<express.Response>`. Multiple server instances cannot share this set. Any plan for horizontal scaling requires replacing this with a pub/sub mechanism before it will work.

### `db.save()` is debounced (50 ms) but `saveImmediate()` is synchronous
High-frequency mutation loops (e.g. seeding 100 records) should call `saveImmediate()` once at the end, not trigger 100 debounced saves. The debounce resets the timer on each call, so rapid writes can delay the actual flush indefinitely.

### No ZIP export endpoint exists despite `jszip` being installed
`jszip` is a declared dependency but there is no `/api/export/zip` route. Any plan referencing ZIP export must add the route to `server.ts`; it cannot be assumed to exist.
