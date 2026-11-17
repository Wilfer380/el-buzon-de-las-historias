# El Buzón de las Historias

Accessible workshop web experience for Aprender Sin Barreras, beginning with the 18 November 2026 Microsoft Teams workshop.

## Local development

```bash
npm install
npm run dev
```

The B1 static shell needs no credentials. When Supabase integration begins, copy `config/env.example.txt` to `.env.local` and fill only the public URL and anonymous key. The Pi host safety layer prevents writing dot-environment files directly; never add a service-role key to browser configuration.

## Quality checks

```bash
npm run typecheck
npm test -- --run
npm run build
```

Playwright is configured with one smoke test, but browser binaries are intentionally not installed in B1.

## Current scope

B1 provides landing, participant, organizer, and projection route shells. Supabase, realtime updates, QR codes, authentication, story submission, facilitation controls, and deployment are **not implemented**. See `docs/architecture.md` and `docs/workshop-flow.md`.
