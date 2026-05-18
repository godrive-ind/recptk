# Sistem Rekrutmen PTK

Production-ready recruitment management platform for PTK requests, candidate tracking, reporting, master data, import/export, and operational audit logs.

## Stack

- Next.js App Router
- React
- TypeScript
- Prisma ORM
- PostgreSQL
- Tailwind CSS
- Vercel deployment

## Quick Start

```bash
npm install
cp .env.example .env.local
npm run db:dev
npm run db:seed
npm run dev
```

## Validation

```bash
npm run typecheck
npm run lint
npm run build
npm audit --omit=dev
```

## Documentation

- [Production audit](docs/PRODUCTION_AUDIT.md)
- [Deployment guide](docs/DEPLOYMENT.md)
