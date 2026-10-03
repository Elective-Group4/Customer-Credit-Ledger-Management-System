# Customer Credit Ledger Management System

CCLMS is a React web application for sari-sari store owners who need to manage customers, product credit, payments, balances, and transaction history in one store-scoped ledger. Administrators manage owner accounts, activity logs, and the public landing-page content.

## Objectives

- Replace paper-based credit tracking with a searchable digital ledger.
- Keep customer, product, credit, and payment data isolated per store.
- Give administrators controlled owner-account management.
- Preserve financial history while enforcing balance and account-status rules.

## Features

- Public landing page with admin-managed content.
- Supabase Auth login and password reset with OTP.
- Admin dashboard, owner management, activity logs, and landing-page management.
- Store-owner dashboard with customer balances and summaries.
- Customer and product management with active/inactive status.
- Credit entries, due dates, payment history, and full or partial payments.
- Transaction filtering and Excel export.
- Per-account light/dark/system theme preferences.
- Owner-scoped Supabase RLS and server-side validation.

## Technology

- React 19, Vite, and JavaScript/JSX
- React Router, TanStack Query, React Hook Form, and Zod
- shadcn/ui, Radix UI, Tailwind CSS, Lucide React, and Sonner
- Supabase Auth, PostgreSQL, RLS, RPC functions, Storage, and Edge Functions
- Vercel for static frontend hosting

## Repository Structure

```text
Customer-Credit-Ledger-Management-System/
├── cclms_react/       React/Vite application
├── supabase/           Edge Functions and database migrations
├── docs at root        Architecture, security, API, UI, and scaling notes
└── cclms_react/docs/   Supabase setup and feature documentation
```

See [FILE_STRUCTURE.md](FILE_STRUCTURE.md) for the detailed source map.

## Requirements

- Node.js and npm
- A Supabase project with Auth and PostgreSQL enabled
- Supabase CLI only when deploying Edge Functions

## Installation and Local Development

```powershell
Set-Location cclms_react
npm install
npm run dev
```

Before starting the app, create `cclms_react/.env.local` using the variable names below. The repository does not include real credentials.

### Environment Variables

Create `cclms_react/.env.local` with placeholder values replaced by your project values:

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-supabase-publishable-key
```

Never place a Supabase service-role key in a `VITE_*` variable or browser source. Do not commit `.env.local`.

## Supabase Setup

Run the SQL scripts in the Supabase SQL Editor after reviewing the existing project schema:

1. [database-setup.md](cclms_react/docs/database-setup.md) for the base schema and RLS requirements.
2. [customer-management-supabase.sql](cclms_react/docs/customer-management-supabase.sql) for customer codes and owner-scoped customer policies.
3. [owner-account-deactivation.sql](supabase/owner-account-deactivation.sql) for inactive-owner access checks and Realtime.
4. [account-theme-and-ledger-security.sql](supabase/account-theme-and-ledger-security.sql) for account themes, safe customer deletion, and inactive-credit protection.
5. [password-reset-otp.sql](supabase/password-reset-otp.sql) for the password-reset OTP table.
6. [landing-page-database.md](cclms_react/docs/landing-page-database.md) for the landing-page table and policies.

Deploy the required Edge Function after configuring its Supabase secrets:

```powershell
supabase functions deploy smart-action
```

## Production Build

```powershell
Set-Location cclms_react
npm run build
npm run preview
```

The current project also provides `npm run lint`. Some older files may require separate cleanup if the full repository lint reports unrelated pre-existing findings.

## Vercel Deployment

1. Import the repository into Vercel.
2. Set the project root to `cclms_react`.
3. Use `npm run build` as the build command.
4. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` to the Vercel environment.
5. Keep the SPA rewrite in [vercel.json](cclms_react/vercel.json) so client-side routes resolve to `index.html`.

## Documentation

- [System architecture](SYSTEM_ARCHITECTURE.md)
- [API operations](API_ENDPOINTS.md)
- [Security and RLS](SECURITY.md)
- [UI design conventions](UI_DESIGN.md)
- [Scalability notes](SCALABILITY.md)
- [Database setup](cclms_react/docs/database-setup.md)
- [Owner Supabase integration](cclms_react/docs/owner-supabase-integration.md)
- [Landing-page database](cclms_react/docs/landing-page-database.md)
- [Admin access troubleshooting](cclms_react/docs/admin-access-403-bug-documentation.md)
- [Owner account deactivation](cclms_react/docs/owner-account-deactivation-documentation.md)
