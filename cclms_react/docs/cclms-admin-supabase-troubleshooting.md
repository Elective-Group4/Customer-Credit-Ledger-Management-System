# CCLMS Admin Management & Supabase Troubleshooting Documentation

## 1. Project Context

The CCLMS project is a React + Vite + JSX application using Supabase for
authentication and database management.

The Admin section contains:

-   Admin Dashboard
-   Owner Management
-   Admin Logs

The intended Admin workflow is:

``` text
Admin Login
    ↓
Admin Dashboard
    ├── Owner Management
    │     ├── Create Owner
    │     ├── Read/View Owner
    │     ├── Update Owner
    │     └── Delete Owner
    │
    └── Admin Logs
          ├── Login
          ├── Logout
          ├── Dashboard access
          ├── Owner Management access
          └── Owner CRUD actions
```

The application uses:

-   React
-   Vite
-   JSX
-   React Router
-   Supabase Auth
-   Supabase PostgreSQL
-   shadcn/ui
-   Lucide React

------------------------------------------------------------------------

# 2. Problem 1 --- Owner Management Redirected to Login

## Symptoms

When clicking **Owner Management**, the application appeared to log the
administrator out or redirect back to `/login`.

The original `AdminRoute` always returned the dashboard:

``` jsx
function AdminRoute() {
  ...

  return status === "allowed"
    ? <AdminDashboard />
    : <Navigate to="/login" replace />
}
```

This meant that even when another admin route was requested, the route
guard rendered `AdminDashboard`.

## Approach

The route guard was changed to accept `children`:

``` jsx
function AdminRoute({ children }) {
  ...

  if (status === "denied") {
    return <Navigate to="/login" replace />
  }

  return children
}
```

The routes were then separated:

``` jsx
<Route
  path="/admin"
  element={
    <AdminRoute>
      <AdminDashboard />
    </AdminRoute>
  }
/>

<Route
  path="/admin/owners"
  element={
    <AdminRoute>
      <OwnerManagement />
    </AdminRoute>
  }
/>
```

This allowed each protected page to render correctly.

------------------------------------------------------------------------

# 3. Problem 2 --- Sidebar Disappeared on Owner Management

## Symptoms

After fixing the route guard, `/admin/owners` opened correctly, but the
sidebar disappeared.

## Cause

The sidebar was located inside `AdminDashboard.jsx`:

``` jsx
<SidebarProvider>
  <AppSidebar />

  <SidebarInset>
    ...
  </SidebarInset>
</SidebarProvider>
```

When React navigated from `/admin` to `/admin/owners`, `AdminDashboard`
was replaced by `OwnerManagement`.

Therefore, the sidebar was also removed.

## Approach

A shared `AdminLayout.jsx` was introduced.

The layout contains:

-   `SidebarProvider`
-   `AppSidebar`
-   `SidebarInset`
-   `Outlet`

Example:

``` jsx
import { Outlet } from "react-router-dom"
import { AppSidebar } from "@/components/app-sidebar"

import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"

import { TooltipProvider } from "@/components/ui/tooltip"

export default function AdminLayout() {
  return (
    <SidebarProvider>
      <AppSidebar />

      <TooltipProvider>
        <SidebarInset>
          <Outlet />
        </SidebarInset>
      </TooltipProvider>
    </SidebarProvider>
  )
}
```

The dashboard then contains only its own page content.

## Final routing structure

``` text
/admin
    ↓
AdminRoute
    ↓
AdminLayout
    ├── AppSidebar
    └── Outlet
         ├── /admin          → AdminDashboard
         ├── /admin/owners   → OwnerManagement
         └── /admin/logs     → AdminLogs
```

This keeps the sidebar visible while navigating between Admin pages.

------------------------------------------------------------------------

# 4. Problem 3 --- `AdminDashboard is not defined`

## Symptoms

The browser showed:

``` text
Uncaught ReferenceError: AdminDashboard is not defined
```

## Cause

`AdminDashboard` was being used in `App.jsx`, but its import had been
removed.

## Approach

The import was restored:

``` jsx
import AdminDashboard from "./components/Modules/Admin/AdminDashboard"
```

The same principle applies to other routed components: every component
used in `App.jsx` must be imported.

------------------------------------------------------------------------

# 5. Problem 4 --- 403 Forbidden from `store_owners`

## Symptoms

Owner Management generated:

``` text
GET /rest/v1/store_owners
403 Forbidden
```

The query was similar to:

``` jsx
supabase
  .from("store_owners")
  .select(`
    id,
    profile_id,
    store_name,
    branch,
    created_at,
    updated_at,
    profiles (
      id,
      full_name,
      email,
      phone_number,
      role,
      status,
      created_at
    )
  `)
```

## Cause

Supabase Row Level Security (RLS) and table permissions were preventing
the authenticated Admin from reading the required records.

The `profiles` table initially had only one SELECT policy:

``` text
Users can view their own profile
```

Therefore, an Admin could read their own profile but could not read the
store-owner profiles required by Owner Management.

## Approach

Table privileges were granted:

``` sql
GRANT SELECT ON public.profiles TO authenticated;
GRANT SELECT ON public.store_owners TO authenticated;
```

An Admin policy for `store_owners` was also created.

The goal was to allow authenticated administrators to read store-owner
records without exposing them to unauthorized users.

------------------------------------------------------------------------

# 6. Problem 5 --- Infinite Recursion in `profiles` RLS

## Symptoms

After creating an Admin policy, the application produced:

``` text
code: '42P17'
message: 'infinite recursion detected in policy for relation "profiles"'
```

The error affected both:

-   `App.jsx`
-   `LoginPage.jsx`

The query:

``` text
/rest/v1/profiles?select=role&id=eq.<user-id>
```

returned HTTP 500.

## Cause

The problematic policy checked the `profiles` table from inside a policy
on the same `profiles` table.

Conceptually, the policy was:

``` sql
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE public.profiles.id = auth.uid()
      AND public.profiles.role = 'admin'
  )
);
```

The database had to evaluate the `profiles` policy.

While evaluating it, the policy queried `profiles`.

That query required the same policy to be evaluated again.

This created a recursion loop:

``` text
profiles policy
    ↓
query profiles
    ↓
profiles policy
    ↓
query profiles
    ↓
...
```

PostgreSQL stopped the query with:

``` text
42P17 infinite recursion
```

## Approach

The recursive policy was removed:

``` sql
DROP POLICY IF EXISTS "Admins can view all profiles"
ON public.profiles;
```

A security-definer helper function was then introduced:

``` sql
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid()
      AND role = 'admin'
  );
$$;
```

The policy can then call the function:

``` sql
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  id = auth.uid()
  OR public.is_admin()
);
```

The important design principle is:

> Do not directly query the same RLS-protected table from its own policy
> when that creates recursive policy evaluation.

------------------------------------------------------------------------

# 7. Problem 6 --- Existing Policy Conflict

## Symptoms

When creating the `store_owners` policy again, Supabase returned:

``` text
ERROR: 42710:
policy "Admins can view store owners"
for table "store_owners" already exists
```

## Cause

The policy had already been successfully created.

The SQL attempted to create the same policy a second time.

## Approach

The existing policy was kept instead of creating another duplicate
policy.

This is why it is useful to inspect policies first:

``` sql
SELECT
  schemaname,
  tablename,
  policyname,
  roles,
  cmd
FROM pg_policies
WHERE tablename IN ('profiles', 'store_owners');
```

This query is read-only and helps identify what policies already exist.

------------------------------------------------------------------------

# 8. Problem 7 --- Admin Logs Relationship Ambiguity

## Symptoms

The Admin Logs page produced:

``` text
PGRST201
Could not embed because more than one relationship
was found for 'admin_logs' and 'profiles'
```

## Cause

The `admin_logs` table contains two foreign keys pointing to `profiles`:

``` text
admin_logs.admin_id
        ↓
profiles.id

admin_logs.target_user_id
        ↓
profiles.id
```

The original query used:

``` jsx
profiles (
  full_name,
  email
)
```

Supabase/PostgREST could not determine which relationship was intended.

It could mean:

``` text
admin_logs.admin_id → profiles
```

or:

``` text
admin_logs.target_user_id → profiles
```

## Approach

The relationship was made explicit.

For the administrator who performed the action:

``` jsx
admin:profiles!admin_logs_admin_id_fkey (
  full_name,
  email
)
```

Then the component accesses:

``` jsx
log.admin?.full_name
```

and:

``` jsx
log.admin?.email
```

The target owner can continue to use:

``` jsx
log.target_name
```

## Relationship diagram

``` text
                    ┌──────────────┐
                    │   profiles   │
                    │              │
                    │ id           │
                    │ full_name    │
                    │ email        │
                    └──────┬───────┘
                           ▲
                           │ admin_id
                           │
                    ┌──────┴───────┐
                    │ admin_logs   │
                    │              │
                    │ admin_id     │
                    │ target_user_id
                    │ action       │
                    │ target_name  │
                    │ ip_address   │
                    │ created_at   │
                    └──────┬───────┘
                           │
                           │ target_user_id
                           ▼
                    ┌──────────────┐
                    │   profiles   │
                    └──────────────┘
```

------------------------------------------------------------------------

# 9. Admin Logs Database Design

The Admin Logs table was designed with:

``` sql
CREATE TABLE IF NOT EXISTS public.admin_logs (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

  admin_id uuid
    REFERENCES public.profiles(id)
    ON DELETE SET NULL,

  action text NOT NULL,

  target_user_id uuid
    REFERENCES public.profiles(id)
    ON DELETE SET NULL,

  target_name text,

  ip_address inet,

  created_at timestamptz NOT NULL DEFAULT now()
);
```

## Fields

  Field              Purpose
  ------------------ ----------------------------------------
  `id`               Unique log identifier
  `admin_id`         Admin who performed the action
  `action`           Activity/action type
  `target_user_id`   Owner/profile affected by the action
  `target_name`      Name of affected owner
  `ip_address`       IP address associated with the request
  `created_at`       Date and time of activity

------------------------------------------------------------------------

# 10. Planned Admin Log Actions

The project uses consistent action names:

``` text
LOGIN
LOGOUT

VIEW_DASHBOARD
VIEW_OWNER_MANAGEMENT
VIEW_OWNER

CREATE_OWNER
UPDATE_OWNER
DELETE_OWNER
```

Example:

``` text
September 27, 2026 2:14 PM
System Administrator
CREATE_OWNER
Juan Dela Cruz
192.168.x.x
```

------------------------------------------------------------------------

# 11. Admin Logs Security

RLS was enabled:

``` sql
ALTER TABLE public.admin_logs ENABLE ROW LEVEL SECURITY;
```

Admins can read logs:

``` sql
CREATE POLICY "Admins can view admin logs"
ON public.admin_logs
FOR SELECT
TO authenticated
USING (
  public.is_admin()
);
```

Authenticated users are granted SELECT access:

``` sql
GRANT SELECT ON public.admin_logs TO authenticated;
```

However, normal users should not be allowed to freely insert
administrative activity records from the browser.

For sensitive operations such as:

-   Create Owner
-   Update Owner
-   Delete Owner

the preferred architecture is to create the logs inside Supabase Edge
Functions.

------------------------------------------------------------------------

# 12. Supabase Auth Security Approach

Owner accounts require Supabase Auth users.

The frontend should **not** use the Supabase `service_role` key.

The service-role key must never be placed in:

``` text
Vite frontend
React source code
.env variables exposed to the browser
```

Instead:

``` text
React Frontend
      ↓
Supabase Edge Function
      ↓
Supabase Auth Admin API
      ↓
Database
```

This allows the server-side function to safely perform privileged
operations.

The same Edge Function can record:

``` text
CREATE_OWNER
UPDATE_OWNER
DELETE_OWNER
```

in `admin_logs`.

------------------------------------------------------------------------

# 13. Current Project Architecture

The Admin section is structured as:

``` text
src/
├── components/
│   ├── app-sidebar.jsx
│   │
│   └── Modules/
│       └── Admin/
│           ├── AdminDashboard.jsx
│           ├── AdminLayout.jsx
│           ├── OwnerManagement.jsx
│           └── AdminLogs.jsx
│
├── lib/
│   └── supabase.js
│
└── App.jsx
```

The route structure is:

``` text
/login

/admin
/admin/owners
/admin/logs
```

Protected Admin routing:

``` text
AdminRoute
    ↓
AdminLayout
    ├── AppSidebar
    └── Outlet
         ├── AdminDashboard
         ├── OwnerManagement
         └── AdminLogs
```

------------------------------------------------------------------------

# 14. Troubleshooting Method Used

The main troubleshooting approach was:

### Step 1 --- Read the browser error

Instead of assuming the problem was React, the browser console was
inspected.

Examples:

``` text
403 Forbidden
```

``` text
42P17 infinite recursion
```

``` text
PGRST201 relationship ambiguity
```

### Step 2 --- Identify the layer causing the error

The problems were separated into:

``` text
React routing
     ↓
Supabase REST API
     ↓
PostgreSQL permissions/RLS
     ↓
PostgREST relationships
```

### Step 3 --- Inspect existing database policies

A read-only query was used:

``` sql
SELECT
  schemaname,
  tablename,
  policyname,
  roles,
  cmd
FROM pg_policies
WHERE tablename IN ('profiles', 'store_owners');
```

This prevented unnecessarily creating duplicate policies.

### Step 4 --- Make the smallest required change

Examples:

-   Fix the route guard instead of changing authentication.
-   Move the sidebar into a shared layout instead of duplicating it.
-   Add RLS access instead of disabling RLS.
-   Use a helper function instead of recursively querying `profiles`.
-   Explicitly select the foreign-key relationship instead of changing
    the database structure.

------------------------------------------------------------------------

# 15. Important Lessons

## RLS policies must be designed carefully

A policy on `profiles` should not recursively query `profiles` in a way
that causes PostgreSQL to evaluate the same policy repeatedly.

## Route layouts should contain shared UI

The sidebar belongs in `AdminLayout`, not inside an individual dashboard
page.

## Foreign-key relationships must be explicit when multiple relationships exist

When two columns reference the same table, PostgREST needs the
relationship specified.

## Frontend code should not contain privileged Supabase credentials

The service-role key belongs only in server-side environments such as
Supabase Edge Functions.

## Database errors should be diagnosed before changing the schema

Useful diagnostic queries include:

``` sql
SELECT *
FROM public.admin_logs
ORDER BY created_at DESC;
```

and:

``` sql
SELECT
  schemaname,
  tablename,
  policyname,
  roles,
  cmd
FROM pg_policies
WHERE tablename IN (
  'profiles',
  'store_owners',
  'admin_logs'
);
```

------------------------------------------------------------------------

# 16. Final Result

The troubleshooting process established the following architecture:

``` text
                    CCLMS
                      │
                      ▼
                React + Vite
                      │
                React Router
                      │
                      ▼
                AdminRoute
                      │
                      ▼
                AdminLayout
              ┌───────┴────────┐
              │                │
          AppSidebar         Outlet
                               │
             ┌─────────────────┼────────────────┐
             │                 │                │
             ▼                 ▼                ▼
        Dashboard       Owner Management    Admin Logs
             │                 │                │
             └─────────────────┼────────────────┘
                               ▼
                            Supabase
                               │
                 ┌─────────────┼─────────────┐
                 │             │             │
                 ▼             ▼             ▼
              Auth         PostgreSQL       RLS
                               │
                 ┌─────────────┼─────────────┐
                 │             │             │
                 ▼             ▼             ▼
              profiles    store_owners   admin_logs
```

The major issues encountered were:

1.  Admin route incorrectly rendering the dashboard.
2.  Sidebar disappearing because it was inside the dashboard page.
3.  Missing `AdminDashboard` import.
4.  `403 Forbidden` caused by database permissions/RLS.
5.  Infinite recursion caused by an RLS policy querying its own
    `profiles` table.
6.  Duplicate policy creation.
7.  PostgREST relationship ambiguity because `admin_logs` references
    `profiles` twice.

The final approach was to use a shared Admin layout, protected nested
routes, controlled RLS policies, an `is_admin()` security-definer
function, and explicit PostgREST foreign-key relationships.
