# Owner Account Deactivation

## How it works

The existing `public.profiles.status` column is the source of truth. Owner Management sends status changes through the existing `smart-action` Edge Function, which validates the admin session, confirms the selected profile is an owner, and updates only that profile. The Edge Function also rejects attempts to edit the current administrator account.

## Login validation

After Supabase Auth succeeds, `LoginPage.jsx` loads the matching profile and requires both `role = 'owner'` and `status = 'active'` before navigating to `/owner`. An inactive owner is signed out immediately and sees: `Your account has been deactivated. Please contact the administrator.` Admin login is unchanged.

## Automatic logout

`useOwnerAccessGuard` runs inside the existing `OwnerLayout`. It checks the current session and profile on mount, subscribes to `public.profiles` using the authenticated user's UUID, and signs out when the row is deleted, loses the owner role, or is no longer active. A second status check runs every 15 seconds. Network errors during backup checks are ignored so an active owner is not logged out because of a temporary failure. The hook prevents duplicate logout calls and removes the Realtime channel and interval on unmount.

## Database changes

Run `supabase/owner-account-deactivation.sql` in the Supabase SQL Editor. It:

- Requires `current_owner_store_id()` to resolve only active owner profiles.
- Enables RLS on the existing `profiles` table and adds an owner-only self-read policy only when that named policy is absent. The policy permits reading the owner row even when inactive so Realtime can deliver the transition.
- Adds `public.profiles` to `supabase_realtime` only when it is not already present.
- Reports the deployed policies for `profiles`, `store_owners`, `customers`, `products`, `credit_entries`, `credit_entry_items`, and `payments` for review.

No profiles table, status column, Auth user, or service-role key is added to the frontend. The service-role key remains an Edge Function secret.

## RLS and security considerations

The helper used by owner data policies returns no store for inactive, deleted, or non-owner profiles. Existing policies on every owner-owned table must use that helper (or an equivalent active-owner predicate) for `SELECT`, `INSERT`, `UPDATE`, and `DELETE`. Child-table policies must also verify their parent belongs to the current store. Do not add public profiles access or disable RLS. Review the verification query in the SQL migration before production deployment and repair any broad existing policy it reports.

## Testing

1. Run the SQL migration and verify the policy output and Realtime publication query.
2. Build the frontend with `cd cclms_react` followed by `npm run build`.
3. Log in as an active owner and open the dashboard in one browser session.
4. As an admin, edit that owner and select `Inactive`. The owner session should sign out and return to `/login` with the deactivation message without waiting for a manual refresh.
5. Reactivate the owner and verify login works again.
6. Keep a second active owner logged in and verify that account remains connected.
7. Try inactive-owner direct reads/writes against each owner-owned table; RLS must deny or return no rows.
8. Test an inactive owner login and confirm it is signed out before dashboard navigation.

## Troubleshooting

- If Realtime does not log the owner out, confirm `profiles` appears once in `supabase_realtime`, the owner can select only their own profile row, and the deployed database update actually changes `profiles.status`.
- If the dashboard loads after deactivation, inspect the browser network panel for the profile query and confirm the 15-second backup check is running.
- If the admin update fails, deploy the current `smart-action` function and verify its service-role secret is configured in Supabase.
- If inactive owners can still read business data, inspect the SQL policy output and replace policies that do not call `current_owner_store_id()` or otherwise require an active owner.
