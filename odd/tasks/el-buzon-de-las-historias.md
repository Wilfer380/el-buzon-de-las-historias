# El Buzón de las Historias

## Goal
Build a production-ready interactive platform for the 18 November 2026 UNIMINUTO community workshop, with mobile participation, organizer moderation, projection, voting, collaborative writing, persistence, realtime updates, exports, accessibility, and secure deployment.

## Constraints
- Keep this application isolated from `historias-que-nos-hacen-pensar` and its paused dirty branch.
- Community members author all contributions and story text; the application must not generate or rewrite their content with AI.
- Participants may remain anonymous or use an optional pseudonym; collect no email, phone, address, or identity document.
- Organizer access requires real authentication and database authorization.
- Supabase/PostgreSQL is authoritative; localStorage may retain only a participant session token or harmless UI preferences.
- Projection receives approved, presentation-safe data only.
- Public URLs and QR codes must never point to localhost in production.
- No deployment, push, or secret configuration without explicit user authorization and credentials.
- No commit without explicit user authorization.

## Acceptance baseline
- Mobile participant flow, organizer dashboard, and 16:9 projection view.
- Moderated contribution inbox and approved mural.
- Two configurable polls with server-enforced lifecycle and duplicate-vote mitigation.
- Collaborative story fragments, ordered draft, immutable versions, and restore workflow.
- Realtime synchronization and reconnect feedback.
- QR/session link, exports, privacy controls, documentation, and representative automated tests.
- Honest reporting for checks that require public infrastructure or credentials.

## Tasks

- [x] B1 — Establish repository, route boundaries, design system, accessibility defaults, environment validation, test harness, CI, and architecture documentation.
  - Status: completed
  - Evidence: typecheck passed; 5/5 tests passed; production build passed; production dependency audit reported 0 vulnerabilities; independent verification approved the slice. Playwright was configured but not executed.
  - Commit: `b0ad9e8` (`feat(app): establish workshop application foundation`)
- [ ] B2 — Add Supabase schema, migrations, organizer authentication, memberships, RLS policies, and policy tests.
  - Status: in progress
  - Evidence: pending
- [ ] B3 — Implement workshop creation, participant-safe join codes, real public URLs, QR display/download, and session restoration.
  - Status: pending
  - Evidence: pending
- [ ] B4 — Implement animated contribution envelopes, server validation, rate limiting, moderation queue, withdrawal, and approved mural.
  - Status: pending
  - Evidence: pending
- [ ] B5 — Implement organizer-controlled stages, configurable timeline, reconnecting projection view, and realtime state synchronization.
  - Status: pending
  - Evidence: pending
- [ ] B6 — Implement configurable topic and narrative polls, atomic open/close, duplicate-vote mitigation, tie workflow, and results projection.
  - Status: pending
  - Evidence: pending
- [ ] B7 — Implement story fragment proposals, moderation, ordering, optimistic conflict checks, draft assembly, immutable versions, and restore-as-new-version.
  - Status: pending
  - Evidence: pending
- [ ] B8 — Implement closure experience, privacy-safe evidence exports, narrative PDF/DOCX/CSV outputs, and audit trail.
  - Status: pending
  - Evidence: pending
- [ ] B9 — Add cross-role unit, integration, RLS, accessibility, responsive, reconnect, and multi-client end-to-end verification.
  - Status: pending
  - Evidence: pending
- [ ] B10 — Complete organizer manual, deployment runbook, environment template, production configuration, authorized deployment, and public-device validation.
  - Status: pending
  - Evidence: pending

## Architecture decision
Use a separate React + TypeScript + Vite repository with route-level participant, organizer, and projection experiences. Use Supabase PostgreSQL, Auth, Realtime, RLS, SQL functions, and narrowly scoped Edge Functions where privileged work is required. PostgreSQL remains authoritative; realtime events only notify clients to refetch authoritative state.

## Review workload
This is a large multi-area product. Implement and verify one bounded work unit at a time. Each unit should remain independently reviewable; split further when an honest unit approaches 400 changed lines.
