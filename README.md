# El Buzón de las Historias

Accessible workshop web experience for Aprender Sin Barreras, beginning with the 18 November 2026 Microsoft Teams workshop.

## Local development

```bash
npm install
npm run dev
```

The static shell needs no credentials. Backend actions fail with a configuration message until `config/env.example.txt` is copied to `.env.local` and its public URL and anonymous key are filled in. Never add a service-role key to browser configuration.

## Quality checks

```bash
npm run typecheck
npm test -- --run
npm run build
```

Playwright is configured with one smoke test, but browser binaries are intentionally not installed in B1.

## Current scope

B2a adds the initial PostgreSQL schema, RLS policy definitions, stable workshop domain types, and a lazy typed Supabase browser client. The migration has not been applied or verified against a Supabase runtime in this environment. Organizer UI, realtime updates, QR codes, authentication flows, story submission, facilitation controls, and deployment remain **not implemented**; organizer UI is B2b. See `docs/architecture.md` and `docs/workshop-flow.md`.
