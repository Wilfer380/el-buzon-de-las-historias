# El Buzón de las Historias

Accessible workshop web experience for Aprender Sin Barreras. The production MVP uses a Cloudflare Worker and D1; the existing Supabase migration remains only as implementation history and an alternative design.

## MVP scope

- Link/QR-first participant entry at `/join/HISTORIA`: enrollment happens anonymously on load with no code, pseudonym, or credential form. The flow includes four contribution categories, pending moderation, own submission history, and an approved-only mural.
- Spanish organizer moderation opens only from a private `/admin/HISTORIA#<capability>` link. The fragment is exchanged server-side for a random two-hour bearer session and immediately removed from browser history; it is never bundled into the frontend.
- Spanish 16:9 projection at `/project/HISTORIA?token=...`, showing only approved content and approved aggregate counts.
- Safe three-second polling with visible connection/error state.

Polls, collaborative story editing, and exports are **not implemented** in this deadline slice.

## Local development

```bash
npm install
# Copy config/env.example.txt to .env.local and fill only its public values.
npm run dev
npm run worker:dev
```

The Worker requires D1 plus `ALLOWED_ORIGIN`, `ORGANIZER_SECRET`, and `PROJECTION_TOKEN`. Do not put the organizer secret in `.env.local`, GitHub variables, source, QR assets, logs, or any `VITE_*` setting. Distribute the organizer capability only in a private URL fragment; the public QR encodes only the participant URL.

## Quality checks

```bash
npm test -- --run
npm run typecheck
npm run build
npm audit --omit=dev --json
git diff --check
```

## Cloudflare deployment

The D1 binding is already configured for database `el-buzon-historias` (`7282917e-0225-4e6a-9390-d9f1ae4fe562`). From the repository root, authenticate Wrangler if needed, then run exactly:

```bash
npx wrangler d1 migrations apply el-buzon-historias --remote
npx wrangler secret put ALLOWED_ORIGIN
npx wrangler secret put ORGANIZER_SECRET
npx wrangler secret put PROJECTION_TOKEN
npx wrangler deploy
```

For `ALLOWED_ORIGIN`, enter the Pages origin only (for example `https://OWNER.github.io`, without the repository path). Use a high-entropy organizer secret and a separate high-entropy projection token. The projection token is a read-only capability and will be public to projection clients; it must never equal the organizer secret.

## GitHub Pages

The Pages workflow builds with `/el-buzon-de-las-historias/` as the Vite base and copies `index.html` to `404.html` for SPA deep-link fallback. Configure only:

```bash
gh variable set VITE_API_URL --body "https://el-buzon-de-las-historias-api.YOUR_SUBDOMAIN.workers.dev"
gh secret set VITE_PROJECTION_TOKEN
```

Enter the same value for `VITE_PROJECTION_TOKEN` as the Worker's `PROJECTION_TOKEN`. No organizer credential belongs in GitHub Pages configuration. Push/Pages deployment is intentionally not performed by this implementation task.

## Security and persistence notes

Participant and organizer bearer tokens are generated with 256 bits of randomness and only SHA-256 hashes are stored in D1. Public participant reads return approved contributions plus that participant's own submissions; projection reads return approved content only. The API enforces bounded JSON, exact-origin CORS, security headers, validation, and best-effort per-isolate rate limiting.

The Supabase migration under `supabase/` was preserved unchanged as historical/alternative documentation. It is not used by the production UI.
