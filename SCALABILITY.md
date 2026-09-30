# Scalability

CCLMS is designed for one store per owner. The first scaling goal is to keep each owner's queries small and isolated while preserving a simple product and customer workflow.

## Current Boundaries

- React is a static Vite application and can be served from Vercel.
- Supabase Postgres stores all business data.
- RLS scopes business rows to the authenticated owner's store.
- `ownerApi` is the single browser data boundary.
- Dashboard summaries are calculated by database RPCs.
- Product images use Supabase Storage rather than database rows.

## Query and Database Practices

1. Keep `store_id` and `created_at` indexes on high-volume tables.
2. Use database views or RPCs for calculated balances and dashboard totals.
3. Keep credit item snapshots (`product_name` and `unit_price`) so historical data does not change when a product is edited.
4. Paginate transaction history when the returned dataset becomes large.
5. Filter by store and date in SQL before sending data to the browser.
6. Keep writes that affect multiple tables inside RPCs or database transactions.

The database setup and index examples are documented in `cclms_react/docs/database-setup.md`.

## Frontend Practices

- Load dashboard sections with parallel requests, as `getDashboard()` does today.
- Keep list pages behind hooks so loading, error, and refresh behavior is consistent.
- Avoid putting large unfiltered datasets in global state.
- Use cache invalidation or targeted updates after create, update, and delete actions.
- Lazy-load pages that are not needed on the first screen, such as the owner profile.

## Growth Path

| Growth point                   | Recommended next step                                                 |
| ------------------------------ | --------------------------------------------------------------------- |
| More customers or transactions | Add SQL pagination, date filters, and server-side search              |
| More dashboard traffic         | Cache or pre-aggregate monthly summaries                              |
| More product images            | Add image size/type validation and lifecycle cleanup                  |
| More admin activity            | Index `admin_logs` by `admin_id`, `action`, and `created_at`          |
| Background work                | Use scheduled/queued Edge Functions for reports and cleanup           |
| Multiple stores per owner      | Add an explicit store membership model before changing route behavior |
| High availability needs        | Use Supabase backups, monitoring, and a documented recovery process   |

## Design Constraint

Do not add a branch or staff model casually. The current domain is one owner managing one store. A multi-store design would require changes to authorization, navigation, data queries, and RLS together.
