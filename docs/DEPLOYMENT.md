# Vercel Deployment Guide

## Required Services

Use a managed PostgreSQL database such as Supabase Postgres, Vercel Postgres, Neon, or Railway Postgres.

## Required Environment Variables

Set these in Vercel Project Settings -> Environment Variables:

```bash
DATABASE_URL="postgresql://postgres.PROJECT_REF:ENCODED_PASSWORD@POOLER_HOST:6543/postgres?sslmode=require&pgbouncer=true"
DIRECT_URL="postgresql://postgres.PROJECT_REF:ENCODED_PASSWORD@POOLER_HOST:5432/postgres?sslmode=require"
ADMIN_USERNAME="admin_hrd"
ADMIN_EMAIL="admin@example.com"
ADMIN_PASSWORD="replace-with-a-long-random-password"
APP_URL="https://your-production-domain"
```

For Supabase, prefer pooler URLs over the direct `db.PROJECT_REF.supabase.co` hostname when deploying from IPv4-only networks. URL-encode special characters in the password; for example, `@` must be written as `%40`.

`ADMIN_PASSWORD` is used only by `npm run db:seed` to create or rotate the first admin account. Do not reuse the old prototype password.

## Local Setup

```bash
npm install
npm run db:generate
npm run db:dev
npm run db:seed
npm run dev
```

## Production Database Setup

After the Vercel project is linked and `DATABASE_URL` is configured:

```bash
npm run db:migrate
npm run db:seed
```

For CI/CD, run migration before deployment promotion or as a controlled release step.

## Vercel Build

Vercel uses:

```bash
npm install
npm run build
```

The project includes `postinstall: prisma generate`, so Prisma Client is generated during Vercel install.

## Production Checklist

- PostgreSQL database created and reachable from Vercel.
- `DATABASE_URL` configured for Production, Preview, and Development as needed.
- `ADMIN_PASSWORD` changed to a strong secret before seeding.
- `npm run db:migrate` completed successfully.
- `npm run db:seed` completed successfully.
- `npm run build` passes locally.
- `npm audit --omit=dev` reports zero vulnerabilities.
- First admin login tested.
- PTK CRUD, candidate CRUD, master data, import, PDF export, and Excel export tested.
- Monitoring/log drain configured in Vercel for production.
- Backups enabled on the PostgreSQL provider.
