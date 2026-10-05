# Forgot-Password Navigation and Blank-Page Symptoms

## Problem
The Forgot Password link did not navigate to its page. React Router's `Link` component expects a `to` prop; using `href` does not provide the route to React Router. The app also had related module-resolution problems during the reset-flow work: the Forgot Password code imported `@/lib/function-error`, while the existing helper file was named `funtion-error.js`, and a later build could not resolve the `PasswordVerifyOTP` module imported by `App.jsx`.

The blank page itself was not independently diagnosed from browser runtime logs. The issues above were found in the same navigation and reset flow.

## Fix
Use `<Link to="/forgot-password">` in the login page and register `/forgot-password` in `App.jsx`. When switching to email reset links, remove unused OTP route imports and routes. Correct or remove any helper imports whose path does not match the actual filename.

## Files Edited
- `src/App.jsx` - removed stale OTP imports and routes during the email-link flow change; the Forgot Password route is registered here.
- `src/components/Modules/ForgotPassword/ForgotPassword.jsx` - changed to use Supabase email recovery instead of the OTP edge function.
- `src/components/Modules/ForgotPassword/ResetPassword.jsx` - changed to use the Supabase recovery session.
- `src/components/Modules/Login/LoginPage.jsx` - no edit was made by the assistant; the required `Link` prop correction was advised.

## Commands Used
```powershell
npm run build
```

## Validation Results
The production build passed from `cclms_react` after removing the unresolved OTP import and routes. The Forgot Password link itself still needs to use `to`, and browser navigation was not manually tested.

# Password-Reset Email Link Flow

## Problem
The requested flow was: enter an email, receive a reset link, click it, and open the Reset Password page. The previous Forgot Password form invoked a custom OTP function and navigated to `/verify-otp`. The reset page also depended on React Router location state, which is not included when opening an email link.

## Fix
The Forgot Password form now calls `supabase.auth.resetPasswordForEmail` with a redirect to `${window.location.origin}/reset-password`. The reset page reads the account email from the Supabase session established by the recovery link. Supabase must allow each app origin plus `/reset-password` in Authentication URL Configuration, and the recovery email template must use Supabase's confirmation URL.

## Files Edited
- `src/components/Modules/ForgotPassword/ForgotPassword.jsx`
- `src/components/Modules/ForgotPassword/ResetPassword.jsx`
- `src/App.jsx`

## Commands Used
```powershell
npm run build
```

## Validation Results
The production build passed. The complete email round trip was not verified because Supabase SMTP delivery was failing.

# Gmail SMTP Recovery-Email Failure

## Problem
Supabase returned `Error sending recovery email`. Gmail SMTP returned `534 5.7.9 Please log in with your web browser and then try again` with `WebLoginRequired`.

## Fix
This is Gmail rejecting the SMTP authentication, not a frontend route error. For testing, sign in to the Gmail account, complete any security prompts, enable 2-Step Verification, and use a Google App Password (not the normal Gmail password). Use the full Gmail address as the SMTP username and sender address. For production, use a transactional email provider such as Resend, Postmark, or Brevo. Never put SMTP credentials in frontend code or share them in logs.

## Files Edited
None. This was a Supabase and Google account configuration issue.

## Commands Used
None.

## Validation Results
No SMTP configuration was changed or tested by the assistant. Validate delivery by requesting a new recovery email and checking Supabase Auth Logs.

# Credit Ledger Data-Loading Failure

## Problem
The Credit Ledger displayed `Unable to load credit data.` The `useOwnerCredits` hook loads customers, products, credit entries, and payments together using `Promise.all`, so a failure in any request rejects the whole load. Customer data comes from the `owner_customer_balances` view, which is defined as a `security_invoker` view in the project SQL documentation.

## Fix
A likely cause is missing table/view privileges or owner-scoped RLS policies. The suggested read grant was:

```sql
grant select on table
  public.owner_customer_balances,
  public.customers,
  public.products,
  public.credit_entries,
  public.credit_entry_items,
  public.payments
to authenticated;
```

Keep RLS enabled and make sure each table has appropriate owner-scoped SELECT policies. This grant was recommended, not run or verified against the Supabase project.

## Files Edited
None for this issue.

## Commands Used
The SQL above was provided as a recommendation; it was not run by the assistant.

## Validation Results
No live database query or Supabase policy check was available. The specific failing read request remains unconfirmed.

# Add-Credit Permission Failure

## Problem
The Add Credit action returned a permission error for `credit_entries`. The frontend calls `ownerApi.createCredit`, which invokes the `create_credit_entry` RPC with customer, product, quantity, and due-date arguments. The repository documents the RPC but does not contain its SQL definition in a migration file.

## Fix
The suggested table grants were:

```sql
grant select, insert on table
  public.credit_entries,
  public.credit_entry_items
to authenticated;
```

The RPC also needs correct owner-scoped RLS policies for inserting the parent credit entry and its item rows. Keep RLS enabled; do not use the service-role key in the browser. These database changes were recommendations and were not executed by the assistant.

## Files Edited
- `src/components/Modules/StoreOwner/CreditTab.jsx` - updated the error handler to display the Supabase message and log details.

## Commands Used
```powershell
npm run build
```

The grants above were provided as SQL instructions but were not run by the assistant.

## Validation Results
The frontend production build passed. The database permission fix was not verified remotely.

# Payment Permission Failure

## Problem
The Record Payment action returned a permission error for the `payments` table. The frontend calls `ownerApi.createPayment`, which invokes the `create_payment` RPC with customer, amount, and payment-type arguments. The repository documents the RPC but does not contain its SQL definition in a migration file.

## Fix
The suggested table grant was:

```sql
grant select, insert on table public.payments to authenticated;
```

Ensure owner-scoped SELECT and INSERT RLS policies exist on `public.payments`. For example, if equivalent policies do not already exist:

```sql
create policy payments_owner_select
on public.payments for select to authenticated
using (store_id = public.current_owner_store_id());

create policy payments_owner_insert
on public.payments for insert to authenticated
with check (store_id = public.current_owner_store_id());
```

Do not create duplicate policies; inspect or update existing policies instead. These SQL changes were recommended, not run by the assistant.

## Files Edited
- `src/components/Modules/StoreOwner/CreditTab.jsx` - updated the payment error handler to display the Supabase message and log details.

## Commands Used
```powershell
npm run build
```

The grants and policies above were provided as SQL instructions but were not run by the assistant.

## Validation Results
The frontend production build passed. The live payment RPC, grants, and RLS policies were not verified against Supabase.

# Barcode Scanner Returns an Incorrect Product Code

## Problem
The product barcode scanner sometimes populated the product ID field with a number that did not match the printed barcode. The scanner accepted the first successful decode from a single camera frame, which could allow a transient false read to be used.

## Fix
Require the same non-empty barcode value to decode successfully across three frames before accepting it. Update the scanner prompt to ask the user to hold the barcode steady until confirmation. The scanner still supports the configured retail barcode formats.

## Files Edited
- `src/components/Modules/StoreOwner/ProductBarcodeScanner.jsx`

## Commands Used
```powershell
npm run build
```

## Validation Results
The production build passed. The change was not tested against the user's physical barcode, so scanner accuracy on that specific product remains unverified.
