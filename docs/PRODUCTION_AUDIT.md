# Production Audit Report

## Executive Summary

The uploaded project was a client-only AI Studio prototype. It had useful recruitment workflows, but production risks were high: authentication was hardcoded in browser storage, business data was only in `localStorage`, Firestore rules allowed public read/write, build/type errors were suppressed, and Excel parsing used a package with unfixed high-severity advisories.

The application is now structured as a Vercel-ready Next.js platform with PostgreSQL persistence through Prisma, HttpOnly session authentication, protected API routes, activity/API/error logging, soft deletes, seeded master data, security headers, and a successful production build.

## Findings And Fixes

| Severity | Problem | Root Cause | Implemented Fix |
| --- | --- | --- | --- |
| Critical | Hardcoded password and mock JWT in `localStorage` | Prototype auth lived fully in the browser | Added `/api/auth/login`, bcrypt password verification, HttpOnly session cookie, session table, logout/session endpoints |
| Critical | Business data was not persistent across users/devices | Zustand state wrote only to browser `localStorage` | Added Prisma/PostgreSQL schema and protected CRUD APIs for PTK, candidates, and master data; store now syncs with server and keeps local fallback |
| Critical | Public Firestore rules allowed unrestricted writes | `allow read, write: if true` | Removed Firebase runtime/config/rules and unused dependencies; production DB is PostgreSQL |
| High | Build and TypeScript errors hidden on Vercel | `ignoreBuildErrors` and `ignoreDuringBuilds` in `next.config.ts` | Removed suppression and fixed TypeScript errors; `npm run build` succeeds |
| High | Report metrics referenced missing `tahapan_seleksi` field | Candidate model used `proses_rekrutmen` | Fixed report logic to count interview stages from `proses_rekrutmen` |
| High | Supply-chain vulnerability in `xlsx` | SheetJS package has unfixed advisories | Replaced with `exceljs`; `npm audit --omit=dev` now reports zero vulnerabilities |
| Medium | Dashboard sorted store array during render | Direct `ptks.sort(...)` mutated shared state | Changed to `[...ptks].sort(...)` |
| Medium | No audit trail or activity history | No backend logging tables | Added `activity_logs`, `api_logs`, `error_logs`, `login_history`, `sessions`, notifications, file metadata, analytics events |
| Medium | Missing global error handling | No app error boundary or persistent client error capture | Added `app/error.tsx` and `/api/errors/client` |
| Medium | Vercel root/build ambiguity | Next 16 Turbopack inferred a parent lockfile | Added `turbopack.root` and `vercel.json` |
| Medium | Large unused runtime dependencies | Firebase/Gemini/motion installed but unused | Removed unused dependencies to reduce install size and attack surface |

## Architecture Improvements

Old structure:
- Client components owned persistence, authentication, and state.
- No trusted server boundary.
- No database schema, migrations, or repeatable seed.
- Build validation was disabled.

New structure:
- `app/api/**` implements authenticated server boundaries.
- `lib/server/**` owns database access, session handling, request logging, validation, and rate limiting.
- `prisma/schema.prisma` defines normalized PostgreSQL tables with relations, timestamps, soft deletes, and indexes.
- Zustand remains the UI state layer, but server state is hydrated from `/api/bootstrap` and mutations sync through API routes.

## Database Documentation

Core entities:
- `users`: authenticated staff with roles: `ADMIN`, `MANAGER`, `RECRUITER`, `VIEWER`.
- `sessions`: revocable HttpOnly session tokens hashed at rest.
- `ptks`: recruitment requests with department, recruiter, dates, target headcount, and soft delete.
- `candidates`: candidate pipeline records linked to PTK.
- `master_data`: normalized dropdown data for departments, recruiters, PICs, reasons, and candidate sources.

Logging and platform tables:
- `login_history`: successful and failed login attempts.
- `activity_logs`: CRUD activity, status changes, admin actions, and system events.
- `api_logs`: method/path/status/duration per API request.
- `error_logs`: server and client errors with context.
- `notifications`: user/system notifications.
- `file_uploads`: uploaded file metadata, size, MIME type, checksum/storage key.
- `analytics_events`: product analytics and event tracking.

Indexing strategy:
- PTK: department/date, recruiter/date, approval date, soft delete.
- Candidates: PTK/status, name, phone, created date, soft delete.
- Logs: user/date, entity/type/id, action/date, path/date, status/date.
- Master data: type/status and unique type/name.

## Performance Report

Before:
- All data processing happened in client arrays with no server pagination path.
- Heavy unused Firebase/Gemini packages increased install and bundle risk.
- Report/dashboard code had repeated filtering and a state mutation.

After:
- Unused dependencies removed.
- Vercel build compiles statically for UI pages and keeps APIs dynamic.
- Server APIs can be extended with pagination/filtering without changing UI contracts.
- Direct array mutation fixed.
- Excel parsing moved from vulnerable `xlsx` to `exceljs`.

## Security Report

Implemented:
- bcrypt password hashing through Prisma seed/admin users.
- HttpOnly, Secure-in-production, SameSite=Lax session cookie.
- Session token hashes stored server-side.
- Login rate limiting.
- Zod validation on all mutation APIs.
- Protected API routes with session checks.
- Security headers: `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`.
- Soft deletes and activity logging for traceability.
- Removed public Firestore rules and unused Firebase config.

Remaining long-term recommendations:
- Add per-role authorization rules per route/action.
- Add database-backed distributed rate limiting if traffic spans many serverless instances.
- Add CSRF token enforcement for state-changing APIs if cross-site embedding requirements change.
- Add automated E2E tests for login, PTK CRUD, candidate CRUD, import, and reporting.

## Validation

Passing:
- `npm run typecheck`
- `npm run lint`
- `npm run build`
- `npm audit --omit=dev`
