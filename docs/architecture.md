# Architecture

## Production path: Worker + D1

The React/Vite client calls the REST API in `worker/index.ts`. `wrangler.jsonc` binds `DB` to D1 database `el-buzon-historias`; `worker/migrations/0001_initial.sql` creates the bounded MVP schema and seeds `HISTORIA`.

The browser receives only `VITE_API_URL` and the read-only public projection capability. `ORGANIZER_SECRET` exists only in the Worker runtime. Organizer login compares the submitted secret in constant time, then stores a hash of a random two-hour bearer session. Participant enrollment likewise returns a high-entropy bearer token and stores only its SHA-256 hash.

Participant reads require that bearer and return approved workshop content plus the participant's own pending/rejected content. Organizer sessions are workshop-scoped. Projection requires `PROJECTION_TOKEN` and returns only approved content and approved aggregate counts. All write payloads are bounded and validated.

Three-second polling is deliberate for the deadline MVP. Each participant, organizer, and projection UI reports connection failures instead of implying realtime delivery.

## Static hosting

`npm run build` sets Vite base `/el-buzon-de-las-historias/`. App routes include that production prefix while retaining root-based test/development routes. The GitHub Pages workflow creates `dist/404.html` from the SPA entry point so direct deep links load the application.

## Historical alternative

The Supabase client types and migration remain in the repository as design history and an alternative backend. They are not imported by the participant production repository and are not production authority.

## Deferred

Polls, collaborative story generation/editing, exports, richer audit history, distributed rate limiting, token rotation UI, and websocket realtime are outside this MVP.
