# Landing Page Database Documentation

This document describes the database required by the CCLMS landing page editor and public landing page.

The implementation uses the Supabase publishable browser client configured by `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`. It does not use the Supabase service-role key in frontend code.

## A. Database Tables

The landing page requires one new table:

### `public.landing_page_content`

| Column       | Type          | Nullable | Default       | Constraints                                                                         |
| ------------ | ------------- | -------- | ------------- | ----------------------------------------------------------------------------------- |
| `id`         | `integer`     | No       | None          | Primary key; limited to value `1` by `landing_page_content_singleton_check`         |
| `content`    | `jsonb`       | No       | `'{}'::jsonb` | Must contain a JSON object, enforced by `landing_page_content_content_object_check` |
| `created_at` | `timestamptz` | No       | `now()`       | Creation timestamp                                                                  |
| `updated_at` | `timestamptz` | No       | `now()`       | Last update timestamp                                                               |

There are no foreign keys, additional unique constraints, or delete operations used by the landing page implementation. The primary key and `id = 1` check make this a singleton configuration table.

The JSON object stored in `content` has this application-level shape:

```json
{
  "brand": { "name": "...", "loginLabel": "..." },
  "hero": {
    "badge": "...",
    "title": "...",
    "description": "...",
    "note": "..."
  },
  "features": {
    "heading": "...",
    "items": [{ "id": "...", "icon": "...", "title": "...", "text": "..." }],
    "footnote": { "icon": "...", "text": "..." }
  },
  "steps": {
    "heading": "...",
    "items": [{ "id": "...", "text": "..." }]
  },
  "about": { "heading": "...", "text": "..." },
  "faqs": {
    "heading": "...",
    "items": [{ "id": "...", "q": "...", "a": "..." }]
  },
  "cta": { "heading": "..." },
  "footer": { "text": "..." }
}
```

The React code applies fallback defaults for missing JSON properties so older or partially populated rows remain renderable. The seeded row below contains the complete initial content.

## B. Complete SQL

Run this complete script in the Supabase SQL Editor. It is safe to run after confirming that the existing `public.profiles` table has the columns `id` and `role` described in Section J.

```sql
create table if not exists public.landing_page_content (
  id integer primary key,
  content jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint landing_page_content_singleton_check check (id = 1),
  constraint landing_page_content_content_object_check check (jsonb_typeof(content) = 'object')
);

alter table public.landing_page_content enable row level security;

-- Public visitors may read the published landing page content.
drop policy if exists landing_page_public_select on public.landing_page_content;
create policy landing_page_public_select
on public.landing_page_content
for select
to anon, authenticated
using (true);

-- Administrators may read the content in the admin editor.
drop policy if exists landing_page_admin_select on public.landing_page_content;
create policy landing_page_admin_select
on public.landing_page_content
for select
to authenticated
using (
  exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'admin'
  )
);

-- Admins may insert the singleton row if it needs to be recreated.
drop policy if exists landing_page_admin_insert on public.landing_page_content;
create policy landing_page_admin_insert
on public.landing_page_content
for insert
to authenticated
with check (
  id = 1
  and exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'admin'
  )
);

-- Admins may update the published content.
drop policy if exists landing_page_admin_update on public.landing_page_content;
create policy landing_page_admin_update
on public.landing_page_content
for update
to authenticated
using (
  exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'admin'
  )
)
with check (
  id = 1
  and exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'admin'
  )
);

grant select on table public.landing_page_content to anon, authenticated;
grant insert, update on table public.landing_page_content to authenticated;

insert into public.landing_page_content (id, content)
values (
  1,
  $$
  {
    "brand": {"name": "SARI-SARI", "loginLabel": "Log In"},
    "hero": {
      "badge": "Customer Credit Ledger Management System",
      "title": "Replace your utang notebook with a digital ledger.",
      "description": "CCLMS replaces the handwritten notebook sari-sari store owners use to track customer utang with a simple, web-based ledger. Record credit by product code, accept partial payments, and see every customer's running balance instantly, right from your phone at the counter.",
      "note": "Owner accounts are created by your system admin."
    },
    "features": {
      "heading": "Key features",
      "items": [
        {"id": "f1", "icon": "UserPlus", "title": "Customer records", "text": "Add customers with auto-generated IDs."},
        {"id": "f2", "icon": "ReceiptText", "title": "Quick credit recording", "text": "Add items by product ID code and quantity."},
        {"id": "f3", "icon": "HandCoins", "title": "Partial payments", "text": "Record bayad any time, and the balance updates automatically."},
        {"id": "f4", "icon": "LayoutDashboard", "title": "Dashboard", "text": "See the overall balance, charts, and a ranking of customers by credit."},
        {"id": "f5", "icon": "History", "title": "Transaction history", "text": "Keep full records you can export."}
      ],
      "footnote": {"icon": "Smartphone", "text": "Works on phones and desktop browsers, right at the counter."}
    },
    "steps": {
      "heading": "How it works",
      "items": [
        {"id": "s1", "text": "Add your products and customers"},
        {"id": "s2", "text": "Record credit and payments as they happen"},
        {"id": "s3", "text": "Check your dashboard for balances and top debtors"}
      ]
    },
    "about": {
      "heading": "About CCLMS",
      "text": "CCLMS was built to solve a problem sari-sari store owners deal with every day: keeping track of who owes what, without relying on a notebook that's easy to lose or hard to search. It's designed around real small-business needs rather than as a generic demo app."
    },
    "faqs": {
      "heading": "FAQs",
      "items": [
        {"id": "q1", "q": "What is CCLMS?", "a": "A web-based tool that helps sari-sari store owners digitally track customer utang (credit) and bayad (payments), replacing manual notebook tracking."},
        {"id": "q2", "q": "Who can use this system?", "a": "Only registered store owners and system admins. Owner accounts are created by the admin, and customers are recorded in the system but don't log in themselves."},
        {"id": "q3", "q": "Is my store's data secure?", "a": "Yes. Passwords are protected, and each store owner can only see their own store's data."},
        {"id": "q4", "q": "Can customers pay in parts?", "a": "Yes. You can record a partial payment at any time, and the customer's balance updates automatically."},
        {"id": "q5", "q": "What if I forget my password?", "a": "You can reset it using your email and a one-time code (OTP)."},
        {"id": "q6", "q": "Does this work on my phone?", "a": "Yes. It works on phones and desktop browsers, so you can use it right at the counter."}
      ]
    },
    "cta": {"heading": "Ready to put your ledger online?"},
    "footer": {"text": "Customer Credit Ledger Management System."}
  }
  $$::jsonb
)
on conflict (id) do update
set content = excluded.content,
    updated_at = now();
```

## C. RLS Policies

RLS is enabled on `public.landing_page_content`.

### `landing_page_public_select`

- Table: `public.landing_page_content`
- Operation: `SELECT`
- Allowed roles: `anon`, `authenticated`
- Who is allowed: Anyone reading the public landing page
- `USING`: `true`
- `WITH CHECK`: Not applicable to `SELECT`

This policy exposes only the content row. It does not expose user profiles, owner data, customer data, transactions, or credentials.

### `landing_page_admin_insert`

- Table: `public.landing_page_content`
- Operation: `INSERT`
- Allowed role: `authenticated`
- Who is allowed: An authenticated user whose `public.profiles.role` is exactly `admin`
- `USING`: Not applicable to `INSERT`
- `WITH CHECK`: `id = 1` and an existing profile for `auth.uid()` has `role = 'admin'`

### `landing_page_admin_update`

- Table: `public.landing_page_content`
- Operation: `UPDATE`
- Allowed role: `authenticated`
- Who is allowed: An authenticated user whose `public.profiles.role` is exactly `admin`
- `USING`: An existing profile for `auth.uid()` has `role = 'admin'`
- `WITH CHECK`: `id = 1` and an existing profile for `auth.uid()` has `role = 'admin'`

There is no landing-page `DELETE` policy because the application never deletes the singleton content row.

### `landing_page_admin_select`

- Table: `public.landing_page_content`
- Operation: `SELECT`
- Allowed role: `authenticated`
- Who is allowed: An authenticated user whose `public.profiles.role` is exactly `admin`
- `USING`: An existing profile for `auth.uid()` has `role = 'admin'`
- `WITH CHECK`: Not applicable to `SELECT`

This policy is explicit for the admin editor. The public SELECT policy also permits authenticated users to read the published row; the policies are combined by PostgreSQL with OR semantics. It does not grant any write capability.

## D. Database Permissions / Grants

The required grants are:

```sql
grant select on table public.landing_page_content to anon, authenticated;
grant insert, update on table public.landing_page_content to authenticated;
```

No `DELETE` grant and no function `EXECUTE` grant are required by this implementation.

## E. Authorization

The existing application role is `admin`. No new role is introduced.

The admin route checks the authenticated user's row in `public.profiles` and permits the editor only when `profiles.role = 'admin'`. The database applies the same rule independently in the insert and update RLS policies:

```sql
exists (
  select 1
  from public.profiles
  where profiles.id = auth.uid()
    and profiles.role = 'admin'
)
```

The frontend route guard is only a user-interface check. RLS is the database authorization boundary.

## F. Public Access

The public landing page reads the row from `public.landing_page_content` through the shared `useLandingContent` hook. The query is equivalent to:

```js
supabase
  .from("landing_page_content")
  .select("content")
  .eq("id", 1)
  .maybeSingle();
```

Publicly readable data is the `content` JSONB value for row `id = 1`. Anonymous users (`anon`) and authenticated users may read it through `landing_page_public_select`. Anonymous users cannot insert, update, or delete content.

## G. Admin Access

The admin editor requires:

1. A valid Supabase Auth session.
2. A matching `public.profiles` row.
3. `public.profiles.role = 'admin'`.

The editor reads with `SELECT` and saves with an upsert to row `id = 1`. When the initial row exists, the save is an `UPDATE`. The admin insert policy also supports recreating the row if it is missing.

The relevant policies are:

- `landing_page_public_select` for the editor's `SELECT` request.
- `landing_page_admin_insert` for an administrator's insert/upsert path.
- `landing_page_admin_update` for saving edited content.

No owner or unauthenticated user can modify the row.

## H. Database Setup Order

Run the setup in this order:

1. Confirm the existing `public.profiles` table contains `id` and `role`.
2. Create `public.landing_page_content` and its constraints.
3. Enable RLS on `public.landing_page_content`.
4. Create the public SELECT, admin INSERT, and admin UPDATE policies.
5. Grant the required table privileges.
6. Insert or upsert the initial landing-page record.
7. Log in as an admin and verify the editor can read and update the row.
8. Open the public landing page while signed out and verify the saved content is displayed.

The complete copy-paste SQL in Section B follows this order except that the seed upsert appears after the policies and grants.

## I. Initial Data

The exact initial landing-page record is included in the complete SQL in Section B. It inserts row `id = 1` and stores the complete content object used by the editor and public page.

The React fallback defaults protect rendering if the row is temporarily unavailable, but the database seed is the authoritative initial record and should be installed in every fresh Supabase project.

## J. Existing Database Dependencies

The landing page depends on these existing Supabase objects:

- `auth.users`: Managed by Supabase Auth. The browser authenticates through Supabase Auth and does not manage passwords in the landing-page table.
- `public.profiles`: Existing CCLMS application table. It must contain at least `id` referencing the authenticated user and `role` containing the existing values `admin` and `owner`.
- `auth.uid()`: Existing Supabase function used by RLS to identify the current authenticated user.
- `anon` and `authenticated`: Existing Supabase database roles used by the browser client.

The landing page does not create or duplicate `profiles`, `auth.users`, authentication functions, owner tables, customer tables, transaction tables, or admin logging tables.

The existing CCLMS application uses `admin` as the administrative role in the implemented route checks and login flow. Existing documentation that refers to a different role name should not be used for this landing-page policy.

## K. No Storage

This Landing Page implementation does not use Supabase Storage and does not require a new Storage bucket.

No Storage policies are required for the landing page. The logo remains a frontend asset and is not uploaded by the landing-page editor.

## L. Database Security

RLS is enabled so that table privileges alone cannot allow unauthorized writes.

- Public users can read only the published landing-page content row.
- Authenticated administrators can insert or update the singleton row.
- Owners and anonymous users cannot modify landing-page content.
- The `id = 1` constraint prevents creation of additional landing-page rows.
- The JSONB object constraint prevents invalid non-object top-level content.
- The admin policies verify `auth.uid()` against `profiles.id` and require `profiles.role = 'admin'`.
- The frontend uses only the publishable Supabase key. The Supabase service-role key is NOT used in frontend code and is not exposed through Vite environment variables.

## M. Maintenance

### Add an editable field

1. Add the field to the JSON structure and the initial seed JSON.
2. Add the field to the shared default/fallback content in `LandingPageManagement.jsx`.
3. Add an editor control and update handler in `LandingPageManagement.jsx`.
4. Render the field in the public `LandingPage.jsx` component.
5. Update this document's JSON shape and seed SQL.
6. No RLS change is needed when the field remains inside the existing `content` JSONB column.

### Change an existing content field

Update the JSON seed value and the editor/public render paths together. Existing rows can be updated through the admin editor or with an `UPDATE` to `content` that preserves the JSON object shape.

### Add another landing-page section

Add a new JSON section, seed it, add editor controls, add public rendering, update `withDefaults`, and update this documentation. The table and RLS policies do not need to change if the section remains inside `content`.

### Update RLS policies

Change the complete policy SQL in Section B and this policy documentation together. Preserve the existing `profiles.role = 'admin'` authorization rule unless the application authentication model is intentionally changed. If a new relational table is introduced, document its columns, grants, RLS policies, and dependencies separately rather than silently storing unrelated data in this table.

## O. Admin Activity Logging

Landing-page saves reuse the existing `public.admin_logs` table and the existing Admin Logs UI. No new logging table, logging function, database column, grant, or RLS policy is required.

The existing log structure used by CCLMS includes these fields used by this activity:

- `admin_id`: The authenticated administrator's Supabase Auth user ID.
- `action`: `LANDING_PAGE_UPDATE`.
- `target_name`: `Landing Page`, which identifies the module/target in the existing UI.
- `ip_address`: The client IP returned by the existing `getClientIp` helper, or `null` if the lookup is unavailable.
- `created_at`: Set by the existing `admin_logs` table default.

The existing table does not expose a metadata/details JSON field or separate module/description columns. Therefore, no field-level changed-section metadata is stored. The action and target identify the activity without adding a new schema contract. No sensitive data is stored: passwords, authentication tokens, service-role keys, and credentials are never included.

The log is created only after the `landing_page_content` upsert succeeds and only after the authenticated administrator is resolved. The save sequence is:

1. The administrator clicks Save.
2. The editor upserts `public.landing_page_content` where `id = 1`.
3. If that update fails, no successful landing-page activity log is inserted and an error notification is shown.
4. If the update succeeds, the editor inserts one `LANDING_PAGE_UPDATE` row into `public.admin_logs`.
5. The success notification is shown only when the content update and activity-log insert both succeed. If content was saved but logging failed, the editor reports that partial failure instead of claiming the log was created.

Typing in fields only changes local React state. Live preview changes do not create logs. Exactly one log attempt is made per successful Save operation.

The existing Admin Logs page already selects and displays `admin_id`, the related administrator profile, `action`, `target_name`, `ip_address`, and `created_at`, so it displays this activity without UI changes. Its existing `profiles` relationship resolves the administrator name and email.

No SQL changes are necessary for logging because the existing `admin_logs` table already supports the required administrator ID, action, target, IP address, and timestamp fields. Existing `admin_logs` RLS and grants remain authoritative.

## N. Final Verification Checklist

- [ ] Database table created
- [ ] Required columns created
- [ ] Initial data inserted
- [ ] RLS enabled
- [ ] Public SELECT policy working
- [ ] Admin SELECT policy working
- [ ] Admin UPDATE policy working
- [ ] Unauthorized users cannot update
- [ ] Frontend can read the data
- [ ] Admin can update the data
- [ ] Live preview works
- [ ] Public landing page displays saved changes
- [ ] Landing-page saves use the existing `admin_logs` table
- [ ] No log is created while typing or previewing
- [ ] One `LANDING_PAGE_UPDATE` activity is created after a successful save
- [ ] Admin Logs displays the landing-page activity and timestamp
- [ ] Failed content saves do not create successful update logs
- [ ] No passwords, tokens, or secrets are stored in logs
- [ ] No Storage bucket was created
- [ ] No service-role key is exposed
