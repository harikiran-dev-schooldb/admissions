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
Only administrators can edit existing enquiry details, delete admissions, and
create/edit/delete fees, academic years and settings. **Staff members can create
new enquiries and update application, entrance, interview, admission-given and
final-admission workflow statuses**, but cannot alter the master configuration
or edit/delete student records. This is enforced on every API endpoint, not just
by hiding buttons. Unlisted email addresses are denied access.

The `/api/access` endpoint returns only the signed-in user's role and whether
they can manage records; the email allowlists are not exposed to the browser.
Add admin addresses to `ADMISSIONS_ADMIN_EMAILS` and permitted read-only
staff addresses to `ADMISSIONS_STAFF_EMAILS` on Vercel, then redeploy.
`LOCAL_AUTH_BYPASS` is permitted only when `NODE_ENV` is not production.
This is a server-configured role list, not an in-app user-invitation system.

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

## Database-backed User Management

The /users page is visible only to Admin accounts. It stores staff and additional
administrators in the WorkspaceMember database table; changes appear in the
WorkspaceMemberAudit log. Changes take effect at the **next authenticated API
request**, without redeploying. Enrolments are tied to the exact lower-case
Neon Auth login email address.

- Admins may grant or revoke Admin and Staff roles, or disable and re-enable users.
- Staff may read admissions, add enquiries, and update admission stages. They
  cannot edit existing student details, academic years, fees, or settings.
- An administrator named in `ADMISSIONS_ADMIN_EMAILS` remains a **protected
  bootstrap administrator** and cannot be disabled, deleted, or demoted in the
  UI. Keep at least one valid account there as a recovery mechanism.
- `ADMISSIONS_STAFF_EMAILS` remains a legacy fallback until old staff are
  moved into the app. Creating a database member overrides their legacy role;
  disabling a member revokes access even if listed in the old environment
  variable. You may delete the legacy staff variable once staff have been added.
- Adding an email grants access **after that person logs in using an existing
  Neon Auth account**. This page does not create passwords, sign-up links or
  send email invitations.
- The user management endpoint is admin-only on the server; the browser never
  receives private environment secrets. Mutations are recorded with actor email.

**Required migration before deployment:** `npm run migrate:deploy` must be run
against the intended Neon database. Production currently lacks
`public."AdmissionConfig"` (Prisma P2021), which causes the Settings loading
error. The migration sequence creates that table and the new
`WorkspaceMember` and `WorkspaceMemberAudit` tables. Back up production data
and run migrations **before** deploying this code. GitHub Actions migrations
only target its temporary CI PostgreSQL instance; passing CI does NOT apply
migrations to Neon Production.

## Database migrations on Vercel Production

The `build` script runs `scripts/deploy-migrations.mjs` before Prisma Client
generation and the Next.js build. Migrations run **only** when
`VERCEL_ENV=production`; preview, CI, and local builds skip this step.
The deploy stops if production migration fails, instead of shipping code
with missing tables. Take a Neon snapshot/branch backup before merging or
redeploying schema changes. Preview deployments do not migrate Neon production.

If your existing production database is not registered in Prisma's
`_prisma_migrations` history, `migrate deploy` may require manually
baselining the schema first. Resolve those errors instead of bypassing
migration safety checks.

## Passwordless email OTP sign-in

The Admissions login displays **only an email address and a six-digit OTP**.
Neon Auth handles sending, expiry and code verification. The app checks the
verified user against the protected bootstrap administrator, database
WorkspaceMember records and the legacy staff list before it issues a code
and before it accepts one. Unlisted or disabled users cannot sign in through
the Admissions auth proxy; the sending endpoint does not disclose membership.
The password login, public signup, and password reset routes are blocked.

**Before disabling email/password in Neon Auth**, test OTP delivery and
session creation using a real administrator account. Managed Neon Auth uses
a shared mail provider unless SMTP is customized. Existing users are retained;
their passwords are not deleted by this UI change. After verification, disable
password sign-in in Neon Auth on the production branch, and confirm that
passwordless sign-in still works. Check OTP delivery quota and spam folders.

## Administrator-only KPIs

The Admissions hero totals and funnel KPI cards, the Fee Structure KPI cards
and annual-total summary, and the Analytics dashboard are **administrator only**.
Staff can still browse paginated admission records, search/filter by class,
enter enquiries, update admission stages, and view fee structures.

The `GET /api/admissions/stats` API requires the `admin` permission (HTTP 403
for staff); `GET /api/admissions/classes` is a staff-readable endpoint that
returns **class names only** for filtering without exposing KPI aggregates.
`GET /api/academic-years` includes counts only for admins and provides a
suggested/default year flag to staff, so the right cohort still loads.
The Analytics route checks the authenticated role on the server before
rendering the admin analytics interface, and its navigation link is hidden
for staff. Directory pagination still exposes the matching-record total
needed to navigate the record list; this is distinct from aggregate KPI cards.

## Audit Logs (Admin only)

Open `/audit-logs` or use the **Audit Logs** item in the sidebar/profile menu.
This paginated, searchable history records server-verified **actor name,
email and role**, action, record type/reference, changed fields and time.
Coverage includes enquiries created/edited/deleted, staff admission-stage
changes, fee structure CRUD, academic-year CRUD, the age calculation setting,
and user role/activation changes. Admins can filter by record type, action,
actor email/name or record reference. Staff cannot view the audit API or page,
but their permitted actions are recorded.

Audit writes occur in the *same Postgres transaction* as the business change:
if the audit insertion fails, the business write rolls back. Changes are
whitelisted by entity type: **DOB, phone and parent contact details, login
tokens and passwords are never copied into audit history**. The database
blocks modification/deletion of existing audit rows via a trigger (database
owners with DDL permission can still remove triggers; this is not a tamper-proof
external archive). No audit-log modification endpoint exists.

The audit migration imports existing User Management role history from
`WorkspaceMemberAudit`. Other historical Admission/Fee/Year/Settings
changes cannot be attributed retroactively and are not fabricated. New
events are recorded from the deployment onward. Direct SQL changes and
Neon Auth sign-ins are outside application API auditing.

## Premium navigation and app notifications

Navigation groups day-to-day workspace pages and administrator-only controls.
On phones, four primary destinations are visible and other authorized pages
are accessible via **More**. The account menu shows the verified user's name,
role, email, settings and sign-out.

Application-stage updates accept both CUID (new records) and UUID (legacy
import) identifiers. Failed stage updates show actionable, nonblocking in-app
notifications instead of browser alerts. Account role/activation changes and
destructive actions use a styled confirmation dialog. Existing authorization
checks, audit logging and stage-transition policies are unchanged.
