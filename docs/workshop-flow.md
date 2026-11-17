# Workshop flow

## Participant

1. Scan the public participant QR or open `/join/HISTORIA`.
2. The page automatically creates an anonymous participant session. No workshop code, pseudonym, password, or other credential is entered.
3. If enrollment fails, the page explains the connection problem and offers a retry button.
4. Choose `experience`, `difficulty`, `hope`, or `idea`, review 1–1000 characters, and submit.
5. The contribution is pending and visible only to that participant and organizers.
6. After organizer approval, it appears in participant murals and projection on the next three-second poll.

`public/qr-participantes.png` contains only the production participant URL. It must never contain an organizer or projection capability.

## Organizer

1. Open the privately distributed `/admin/HISTORIA#<capability>` link.
2. The page reads the capability from `window.location.hash`, immediately removes the fragment with `history.replaceState`, and exchanges it over HTTPS.
3. The Worker performs a constant-time comparison and returns a random two-hour bearer session.
4. Review pending and approved contributions and approve or reject pending items.

If the fragment is missing, the page asks the organizer to reopen their private link. It never renders a credential input.

## Projection

Open `/project/HISTORIA?token=PROJECTION_TOKEN`. The read-only capability returns approved contributions and approved aggregate counts. Pending/rejected text and participant/session credentials are never returned. The public token may instead be supplied by `VITE_PROJECTION_TOKEN` for a fixed display URL.

Connection and polling failures remain visible in every runtime view.

## Not in this slice

Polls, story composition/editing, and exports are not implemented.
