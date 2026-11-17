# Architecture

The application is a client-rendered React and TypeScript Vite application. B2a adds a bounded Supabase data foundation without coupling the static route shell to backend availability.

## Browser boundary

- `src/env.ts` parses only the public Supabase URL and anonymous key.
- `src/data/supabase.ts` creates a typed client on demand. Importing or rendering the static shell requires no credentials; requesting a client without them throws a clear error.
- Browser code must never contain a service-role key. Organizer authority comes from `auth.uid()` and `workshop_memberships`.
- `src/domain/workshop.ts` owns persisted stage and moderation vocabularies. B2b should consume these rather than duplicate string literals.

## Database boundary

`supabase/migrations/20260311150000_b2a_foundation.sql` defines workshops and reusable stage configuration, authenticated-anonymous participant sessions, moderated contributions and story proposals, polls/options/votes, ordered drafts, immutable story-version snapshots, projection state, and append-oriented moderation/audit records.

RLS is enabled on every application table. Organizer and owner checks are separate; direct membership mutation is denied pending an owner-only B2b RPC. Enrollment is a security-definer RPC that accepts an active join code and upserts only `auth.uid()`, including Supabase anonymous-auth users. Base-table reads require same-workshop participant or organizer membership, approved/published status where applicable, and projection state is not public. A future public projection endpoint must use a workshop-specific unguessable token and narrow RPC rather than base-table policies.

Composite constraints keep votes, drafts, versions, and projection references inside one workshop. Votes are unique per poll and participant. Story versions are immutable snapshots; publication is separate and controlled by an organizer-checked RPC. `src/data/database.ts` is an explicit hand-maintained subset, not generated Supabase output.

The migration and static contract tests are definitions only: no Supabase CLI or Docker runtime was available, so SQL syntax, constraints, function behavior, grants, and RLS were not applied or exercised against PostgreSQL here.

## Deferred to B2b

Organizer authentication UI, repositories/services, moderation screens, stage controls, realtime subscriptions, generated Supabase types, and end-to-end RLS verification remain out of scope.
