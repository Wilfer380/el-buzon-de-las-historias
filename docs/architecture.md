# Architecture

B1 is a client-rendered React and TypeScript application built by Vite.

- `src/App.tsx` owns the route boundary and honest static shells.
- `src/styles.css` owns shared visual and accessibility tokens.
- `src/env.ts` exposes optional future Supabase configuration and missing-value diagnostics.
- Vitest and Testing Library verify route boundaries and landing semantics.
- Playwright is configured for later browser smoke coverage.

No backend connection, persistence, realtime transport, authentication, or deployment exists in this slice. Future data access should sit behind a typed service boundary rather than inside route components.
