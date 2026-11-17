# Workshop flow

## Participant

1. Open `/join/HISTORIA` (the landing page's legacy `WORKSHOP` alias resolves to the same seeded workshop).
2. Optionally enter a pseudonym. The Worker returns a 256-bit participant token; only its hash is persisted.
3. Choose `experience`, `difficulty`, `hope`, or `idea`, review 1–1000 characters, and submit.
4. The contribution is pending and visible only to that participant and organizers.
5. After organizer approval, it appears in participant murals and projection on the next three-second poll.

## Organizer

1. Open `/admin/HISTORIA` and submit `ORGANIZER_SECRET` over HTTPS.
2. The Worker performs a constant-time comparison and returns a random two-hour bearer session.
3. Review pending and approved contributions and approve or reject pending items.
4. The secret is cleared from the form and is never a frontend build variable.

## Projection

Open `/project/HISTORIA?token=PROJECTION_TOKEN`. The read-only capability returns approved contributions and approved aggregate counts. Pending/rejected text and participant/session credentials are never returned. The public token may instead be supplied by `VITE_PROJECTION_TOKEN` for a fixed display URL.

Connection and polling failures remain visible in every runtime view.

## Not in this slice

Polls, story composition/editing, and exports are not implemented.
