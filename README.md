This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Production Architecture

- Database: Neon Postgres via Prisma
- Authentication: Neon Auth
- Production migrations: run `npm run migrate:deploy` as an explicit deployment step before `npm run build`
- Admissions are scoped by academic year; migrated legacy admissions belong to `2025-26`
- Supabase is no longer used by the application runtime

## Deploy on Vercel


The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Protected production deployment

All admissions/fee/academic-year API endpoints now verify the Neon Auth session and
check the server-side allowlist before reading or updating private records.

Set these Vercel **Production** environment variables before deploying:
- `ADMISSIONS_ADMIN_EMAILS`: comma-separated administrator login email addresses (required).
- `ADMISSIONS_STAFF_EMAILS`: optional comma-separated staff login email addresses.
- `DATABASE_URL`: Neon pooled PostgreSQL URL ending in `sslmode=verify-full`
  (keep any original `channel_binding=require` argument).
- `NEON_AUTH_BASE_URL` and `NEON_AUTH_COOKIE_SECRET`: existing Neon Auth configuration.

Never commit real passwords or API keys. With an empty administrator allowlist,
data APIs reject requests with HTTP 503 rather than exposing student information.
Only administrators may change fees or academic years or delete an admission; staff
can work with admission records. The `LOCAL_AUTH_BYPASS` override is allowed only
when `NODE_ENV` is not production.

**Migration order matters:** run `npm run migrate:deploy` against the intended
database before deploying the updated Prisma client. The migration backfills
previously-used year codes, adds the 2026-27 cohort, and enforces foreign keys;
an academic year referenced by a fee or admission record cannot be deleted.
Archive an academic year by changing `isActive` to false instead of deleting it.
Always back up production data before running schema migrations.

**Important limitation:** This installation has one shared school workspace.
The allowlists are intended for that single workspace; do not point multiple
independent schools at one database until tenant membership and `schoolId`
isolation are implemented and verified.

## Shared admission eligibility policy

The Settings screen stores the age cutoff date in the `AdmissionConfig` database
table, rather than per-browser local storage. Admins can update the cutoff date;
staff can view it. New admission creation and edits calculate age and eligible
class on the server, and mark any class mismatch as `NOT ELIGIBLE`.
Previous records are not retroactively changed when a cutoff date changes.

The environment-specific initial default is 1 June of the current academic
year until an administrator saves a global cutoff in Settings. This is a
single-school policy, not yet a per-school or per-academic-year configuration.

The test workflow runs `prisma migrate deploy` against an empty PostgreSQL
service, exercises age/workflow unit tests, runs lint, and builds the app.
Use `npm ci` to reproduce the exact committed dependency lockfile.
