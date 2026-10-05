# Barcode Scanner Returns an Incorrect Product Code

## Problem
When scanning a product barcode, the scanner sometimes filled the product ID with a number different from the printed barcode. It accepted the first successful decode from a single camera frame, which could allow a transient false read.

## Fix
Require the same non-empty value to decode successfully across three frames before accepting it. Update the prompt to ask the user to hold the barcode steady until it is confirmed.

## Files Edited
- `src/components/Modules/StoreOwner/ProductBarcodeScanner.jsx`

## Commands Used
```powershell
npm run build
```

## Validation Results
The production build passed. The scanner was not tested against the user's physical barcode, so accuracy for that specific product remains unverified.

# Settled Customer Deletion and Transaction-History Logging

## Problem
The request was to allow deleting a customer once their balance is zero, regardless of active/inactive status, and record that deletion in Transaction History while retaining financial history. The existing delete RPC soft-deleted customers but did not create a transaction-history event. The frontend also expected a response object even though the SQL RPC returned `void`.

## Fix
Keep deletion restricted to a zero balance, independent of customer status. Soft-delete by setting `customers.deleted_at`, preserve credit/payment records, and snapshot the customer's name and code in `customer_deletion_events` within the same database function call. Merge these events into Transaction History and its export. Align the API with the RPC's `void` return. The updated migration script was run by the user in Supabase SQL Editor and reportedly completed with no issues.

The migration does not delete old customer, credit, payment, or log rows. It creates the deletion-event table only if absent and replaces the delete function and related trigger/view definitions.

## Files Edited
- `src/components/Modules/StoreOwner/CustomerManagement.jsx`
- `src/components/Modules/StoreOwner/TransactionHistory.jsx`
- `src/lib/api/owner.js`
- `supabase/account-theme-and-ledger-security.sql`
- `cclms_react/docs/owner-supabase-integration.md`

## Commands Used
```powershell
npm run build
```

The updated SQL migration was run by the user in the Supabase SQL Editor.

## Validation Results
The frontend production build passed. The user reported that the updated SQL script completed without errors. A customer deletion was not manually tested after the migration.

# Existing Balance View Column-Order Error

## Problem
Supabase returned `42P16: cannot change name of view column "balance" to "created_at"` while applying `CREATE OR REPLACE VIEW public.owner_customer_balances`. The new view definition placed timestamp columns before `balance`, conflicting with the existing view's established column order.

## Fix
Keep `balance` in its existing position after `status`, and append `created_at` and `updated_at` after it. Update all SQL/documentation definitions consistently; no view drop is needed.

## Files Edited
- `supabase/account-theme-and-ledger-security.sql`
- `cclms_react/docs/customer-management-supabase.sql`
- `cclms_react/docs/database-setup.md`

## Commands Used
No shell command. The SQL was re-run by the user in the Supabase SQL Editor.

## Validation Results
The user subsequently reported that the updated SQL script completed with no issues. Editor diagnostics found no errors in the changed files.

# Existing Customer-Delete RPC Return-Type Error

## Problem
Supabase returned `42P13: cannot change return type of existing function` for `delete_customer_if_settled(uuid)`. PostgreSQL does not allow `CREATE OR REPLACE FUNCTION` to change an existing function's return type.

## Fix
Drop and recreate only `public.delete_customer_if_settled(uuid)` without `CASCADE`, then reapply the `authenticated` execute grant. This replaces the RPC definition and does not delete customer or transaction data.

## Files Edited
- `supabase/account-theme-and-ledger-security.sql`

## Commands Used
No shell command. The SQL was re-run by the user in the Supabase SQL Editor.

## Validation Results
Editor diagnostics found no errors in the migration. The user subsequently reported that the updated SQL script completed with no issues.
