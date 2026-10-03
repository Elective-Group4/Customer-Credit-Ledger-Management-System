# API Endpoints

This page lists the data operations used by the Customer Credit Ledger Management System (CCLMS).

## Quick Rules

- The browser uses the Supabase publishable key only.
- The signed-in user's session is sent automatically by Supabase.
- Store owners never send a `store_id` chosen by the UI. The database derives the store from `auth.uid()` and RLS.
- Admin owner-management actions use Supabase Edge Functions.
- Errors are returned by Supabase or as `{ success: false, message }` from Edge Functions.

## Browser Data API

The React UI calls `ownerApi` in `cclms_react/src/lib/api/owner.js`. Components should not query Supabase directly.

### Products

| Method                     | Supabase operation                  | Input                                             | Result                   |
| -------------------------- | ----------------------------------- | ------------------------------------------------- | ------------------------ |
| `listProducts()`           | `products.select(*)`                | None                                              | Products ordered by name |
| `createProduct(input)`     | `products.insert()`                 | `name`, `idCode`, `price`, optional `image`       | Created product          |
| `updateProduct(id, input)` | `products.update()`                 | `id`, `name`, `idCode`, `price`, optional `image` | Updated product          |
| `deleteProduct(id)`        | `products.delete()`                 | Product `id`                                      | No content               |
| `toggleProductStatus(id)`  | `products.select()` then `update()` | Product `id`                                      | Updated product          |

Product images are uploaded to the `product-images` Storage bucket under `{store_id}/{product_id}/...`.

### Customers

| Method                      | Supabase operation                  | Input                                     | Result                               |
| --------------------------- | ----------------------------------- | ----------------------------------------- | ------------------------------------ |
| `listCustomers()`           | `owner_customer_balances.select(*)` | None                                      | Customers with calculated balances   |
| `createCustomer(input)`     | `customers.insert()`                | `name`, optional `phoneNumber`, `address` | Created customer with generated code |
| `updateCustomer(id, input)` | `customers.update()`                | Customer `id`, `name`, contact fields     | Updated customer                     |
| `deleteCustomer(id)`        | `delete_customer_if_settled` RPC    | Customer `id`                             | Soft-deletes a zero-balance customer |

The database generates `customer_code`. The client must not create or preview it.

Customer deletion is owner-scoped and allowed only when the calculated balance is exactly zero. The RPC sets `customers.deleted_at` so related credit and payment history remains intact; deleted customers are excluded from `owner_customer_balances`.

### Credit and Payments

| Method                 | RPC                                               | Input                                                       |
| ---------------------- | ------------------------------------------------- | ----------------------------------------------------------- |
| `listCredits()`        | `credit_entries.select()` with customer and items | None                                                        |
| `createCredit(input)`  | `create_credit_entry`                             | `p_customer_id`, `p_product_id`, `p_quantity`, `p_due_date` |
| `listPayments()`       | `payments.select(*)`                              | None                                                        |
| `createPayment(input)` | `create_payment`                                  | `p_customer_id`, `p_amount`, `p_payment_type`               |

Credit and payment RPCs must validate ownership and write related rows atomically.

The `create_credit_entry` path also rejects inactive or soft-deleted customers. The UI filters inactive customers, but the database trigger is authoritative for direct API requests.

### Dashboard and Transactions

| Method               | RPC/query                                                                                    | Result                                                  |
| -------------------- | -------------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| `getDashboard()`     | `owner_dashboard_totals`, `owner_credit_ranking`, `owner_monthly_credit_summary` in parallel | Totals, customer ranking, monthly credit/payment values |
| `listTransactions()` | `credit_entries.select()` with customer and items                                            | Credit history rows                                     |

The transaction page applies search/date filtering in the browser and exports the complete filtered result, not only the visible page.

## Admin Edge Functions

Base URL:

```text
https://<project-ref>.supabase.co/functions/v1/<function-name>
```

Every function requires `POST` and a valid `Authorization: Bearer <user-access-token>` header. The function verifies that the caller's profile has role `admin`.

| Function             | Purpose                                                       | Main body fields                                                                                                |
| -------------------- | ------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `create-store-owner` | Creates Auth user, profile, store-owner record, and admin log | `full_name`, `email`, `password`, `phone_number`, `store_name`, `branch`, optional `status`, `ip_address`       |
| `update-store-owner` | Updates owner Auth email, profile, and store details          | `profile_id`, `store_owner_id`, `full_name`, `email`, `phone_number`, `store_name`, `branch`, optional `status` |
| `delete-store-owner` | Deletes an owner Auth account and its owner records           | `profile_id`                                                                                                    |
| `smart-action`       | Combined create/update/delete owner endpoint                  | `action` plus the fields for the selected action                                                                |

Successful responses are JSON, for example:

```json
{ "success": true, "profile_id": "uuid" }
```

Supported status codes are `200`, `400` for invalid input, `401` for missing/invalid authentication, `403` for non-admin users, `404` for missing records, `405` for unsupported methods, and `500` for unexpected server errors.

## Authentication

Login uses Supabase Auth. Protected React routes check `profiles.role`, but database policies remain the final authorization boundary. Never put `SUPABASE_SERVICE_ROLE_KEY` in browser code.
