# BandDesk

BandDesk is a Next.js + Mantine dashboard for bands and musicians, focused on:
- live/booking pipeline management
- calendar visibility
- shared team workflows
- multi-band access control (API layer in progress toward full UI integration)

This README is meant as a handoff entry-point so work can continue quickly from a new thread.

## Tech Stack
- Next.js (App Router)
- React + TypeScript
- Mantine UI
- TanStack Query
- Better Auth
- Firebase / Firestore
- next-intl (EN/IT)

## Quick Start
1. Install dependencies:
```bash
yarn
```
2. Configure environment:
- copy `.env.template` into `.env`
- fill auth/firebase/email settings
3. Run dev server:
```bash
yarn dev
```
4. Open:
- `http://localhost:3000`

## Useful Scripts
- `yarn dev` start local dev server
- `yarn build` production build
- `yarn test` full checks (typegen + prettier + lint + typecheck + jest)
- `yarn lint` eslint + stylelint
- `yarn storybook` run Storybook

## Implemented Scope (Current)
- Auth flows: login, signup, logout, session-based dashboard protection.
- Dashboard shell with `Home` + `Settings` primary navigation.
- Home widgets for upcoming gigs, booking pipeline, documents snapshot, mini calendar, quick actions.
- Live domain:
  - venues CRUD (`/api/venues`)
  - bookings CRUD (`/api/bookings`)
  - gigs CRUD (`/api/gigs`)
  - booking↔gig consistency rules (confirmed-only linking, date/status constraints, unlink safeguards)
- Settings tabs: profile, security, live, documents, calendar, users.
- Internationalization with `next-intl` (`locale/en.json`, `locale/it.json` + locale selector).
- Multi-band backend foundations:
  - bands context (`/api/bands`, `/api/bands/active`)
  - membership + permission resolution
  - invite lifecycle (create/list/revoke/resend/accept)
  - setlists CRUD with role-based read/write constraints
  - permission matrix (`admin`, `member`, `guest`)

## Known Gaps / In Progress
- `Documents` and `Users` settings areas still use in-memory mock repositories.
- `Profile` and `Security` save actions are not wired to final APIs yet.
- Quick Actions are partially wired (venue action complete; live/document actions pending).
- Multi-band APIs are ready, but UI for active band switcher/invite management/setlists is not yet integrated.
- Live data currently remains mostly owner-scoped and should converge on full `bandId` scoping.

## Key Docs
- `docs/music-dashboard-technical-spec.md` product and UX roadmap (MVP -> V1)
- `docs/schema-setup.md` Firestore schema for bands, memberships, invites, setlists, documents, audit logs

## Suggested Next Priorities
1. Integrate active band context in frontend (band switcher + cached context + guarded routing).
2. Migrate live/booking/gig data flow to `bandId` ownership model end-to-end.
3. Replace document and user mocks with Firestore-backed repositories.
4. Build UI for invite and setlist management using existing `/api/bands/*` routes.
5. Complete profile/security mutation APIs and connect settings forms.

## Project Layout (High Level)
- `src/app` routes and API handlers
- `src/components` dashboard, settings, widgets, modals
- `src/features` repositories/selectors for domain modules
- `src/hooks` query/data hooks
- `src/interfaces` domain contracts
- `src/utils` auth, Firestore collections, validation, permissions helpers

## Notes for Continuation
- Main working branch currently used for this scope: `testing-permissions`.
- Before starting major features, run `yarn test` and capture baseline failures/successes.
- Keep all new domain rules in zod schemas + API-level guards to avoid UI-only validation.
