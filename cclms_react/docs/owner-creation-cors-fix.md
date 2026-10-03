# Store Owner Management Edge Function Fix

## Problem

The Admin Owner Management page could not create or manage a store owner. The browser
reported:

```text
Response to preflight request doesn't pass access control check:
it does not have HTTP ok status.
```

The failed request was:

```text
POST https://<project-ref>.supabase.co/functions/v1/smart-action
```

The request originated from the local Vite application at
`http://localhost:5173`.

## Root Cause

The browser sends an `OPTIONS` preflight request before the authenticated
`POST` request. The hosted `smart-action` Supabase Edge Function was not
returning a successful response with the required CORS headers for that
preflight request.

This is a backend Edge Function problem. Changing the React `fetch` call or
adding a browser-side CORS workaround cannot fix a rejected server preflight.

Edit and Delete previously targeted `update-store-owner` and
`delete-store-owner`. Those function folders existed in the repository, but
the deployed function verified by the project was `smart-action`. Requests to
the undeployed function names returned HTTP 404. The browser could then report
the failed preflight as a CORS error. The CORS message was secondary to the
missing deployed function.

## Approach Taken

The fix was implemented at the Edge Function boundary:

1. Added shared CORS headers for allowed request headers and methods.
2. Added an explicit `OPTIONS` handler that returns HTTP `200`.
3. Added the same CORS headers to normal JSON responses and errors.
4. Kept the service-role key on the server and out of the React application.
5. Validated the caller's Supabase session before allowing owner creation.
6. Confirmed that the caller has the `admin` role.
7. Created the Auth user, profile, and store owner record from the function.
8. Added `update_owner` and `delete_owner` actions to the same function.
9. Deleted or restored partially changed records if a later operation fails.

## Files Added or Updated

- `supabase/functions/_shared/cors.ts`
  - Defines the CORS response headers.
- `supabase/functions/smart-action/index.ts`
  - Handles preflight requests and all owner actions securely.
- `supabase/functions/smart-action/types.d.ts`
  - Helps the regular VS Code TypeScript service understand Deno globals and
    the remote Supabase import.
- `supabase/functions/deno.json`
  - Provides Deno project settings for the Edge Functions folder.
- `.vscode/settings.json`
  - Enables Deno for `supabase/functions` when the Deno VS Code extension is
    available.

## Validation

The function was checked with:

```powershell
cd supabase/functions
deno check smart-action/index.ts
```

The check completed successfully, and VS Code reports no errors for the
function source.

## Deployment

The local source does not change the already-hosted Supabase function until it
is deployed. From the repository root, run:

```powershell
supabase functions deploy smart-action
```

After deployment, reload the Admin page and test Create, Edit, and Delete.

The frontend uses the following action contract for the existing function:

```text
Create: body without action (preserves the existing create flow)
Edit:   action = "update_owner"
Delete: action = "delete_owner"
```

The function validates the caller's `admin` profile role. Edit updates the
owner's Auth email when needed, `profiles`, and `store_owners`. Delete removes
the selected Auth user, profile, and store-owner record. The service-role key
is read only from the Edge Function environment and is never sent to the
React/Vite client.

## Security Notes

- The Supabase service-role key must remain a Supabase server secret.
- It must not be placed in `VITE_*` variables or React source code.
- The function requires an authenticated user with the `admin` profile role.
- The wildcard origin is acceptable for the current development setup. For a
  production deployment, it can be restricted to the actual application
  domains.

## Important Limitation

The Edge Function source and the deployed Supabase function are separate until
the deployment command succeeds. If CORS errors continue after deployment,
check that the command used the same project reference shown in the browser
error and that the deployed function contains the `OPTIONS` handler and the
`update_owner` and `delete_owner` actions.
