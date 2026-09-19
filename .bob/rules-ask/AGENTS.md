# AGENTS.md

This file provides guidance to agents when working with code in this repository.

## Non-Obvious Documentation Context

### `src/utils/` contains browser-only CV engines, not general utilities
Despite being in `src/utils/`, these four files are heavy domain engines: `faceCvEngine.ts` (MediaPipe face/EAR/drowsiness), `busInfraCvEngine.ts` (cabin scan), `ninePointAudit.ts` (nine-point road inspection taxonomy), `pdfReportGenerator.ts` (citizen report PDF). They are not called from `server/`.

### The "CV engines" in `server/` are deterministic heuristic simulators, not real ML inference
`potholeEngine.ts`, `laneEngine.ts`, `pedestrianEngine.ts`, `dividerEngine.ts`, `zigzagEngine.ts`, `twoPhotoZigZagEngine.ts`, and `laneTransitionEngine.ts` perform structured calculations and return typed results — they do not load model weights. Real inference is delegated to Gemini via `aiPipeline.ts`.

### Two separate upload directories exist for different callers
- `/api/media/upload` → `storage/uploads/` (served at `/storage/uploads/…`) — government/operator media
- `/api/citizen/upload-photo` → `public/storage/uploads/` (served as static from `public/`) — citizen photo evidence  
These paths are different and not interchangeable.

### `metadata.json` is IBM AI Studio metadata, not app config
It declares `MAJOR_CAPABILITY_SERVER_SIDE_GEMINI_API` for the AI Studio hosting environment and requests `geolocation` + `camera` browser permissions. It has no effect when running locally or on other platforms.

### Auth is not session-based; it returns a token that is not validated server-side
`authenticate()` returns a user object with a `token` field, but no middleware verifies that token on subsequent requests. Role-based UI gating is entirely client-side in `App.tsx`.

### All geographic data is scoped to Visakhapatnam (GVMC), India
Coordinates, zone names, route IDs, division names, and cost estimates (in INR) throughout `data/`, seed data, and presets are all specific to Visakhapatnam / GVMC / ANITS campus. Any new location data should follow the same regional context.
