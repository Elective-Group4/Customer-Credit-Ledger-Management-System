CCLMS Database Documentation

Customer Credit Ledger Management System

This document explains how the CCLMS database works, how the tables are related, how Row Level Security (RLS) protects owner data, and how the application communicates with Supabase.

1. Database Overview

CCLMS uses Supabase PostgreSQL as its main database.

The database stores information for:

Super Admin accounts

Store Owner accounts

Store products

Customers

Credit / utang transactions

Credit transaction items

Payments / bayad

Customer balances

Owner dashboard statistics

The main database tables are:

profiles

store_owners

products

customers

credit_entries

credit_entry_items

payments

admin_logs

There are also database objects that support the application:

PostgreSQL enums

owner_customer_balances view

Dashboard RPC functions

Credit/payment RPC functions

RLS helper functions

RLS policies

Customer code sequence

2. Database Architecture

The general relationship is:

auth.users
    |
    | 1-to-1
    v
profiles
    |
    | 1-to-1 for owners
    v
store_owners
    |
    +------------------+
    |                  |
    v                  v
products           customers
                       |
                       |
                       +----------------------+
                       |                      |
                       v                      v
                credit_entries             payments
                       |
                       |
                       v
              credit_entry_items

The auth.users table is managed by Supabase Authentication.

The application's profiles table stores application-specific user information such as:

full name

email

phone number

role

status

3. Supabase Authentication

Supabase Authentication manages login accounts through:

auth.users

The application does not directly manage passwords inside the profiles table.

The login process is approximately:

User enters email/password
        |
        v
supabase.auth.signInWithPassword()
        |
        v
Supabase Auth
        |
        v
auth.users
        |
        v
Authenticated session
        |
        v
profiles
        |
        v
Check role

The frontend should use the authenticated Supabase session.

The frontend must never use the Supabase service_role key.

4. Profiles Table

Table

profiles

Purpose

The profiles table contains application-level information for authenticated users.

Typical columns:

Column

Purpose

id

References the Supabase Auth user

full_name

User's full name

email

User email

phone_number

User phone number

role

Application role

status

Account status

created_at

Account creation timestamp

The id corresponds to the authenticated user's ID.

Example:

auth.users.id
      =
profiles.id

5. User Roles

The system has two important application roles:

superadmin
owner

Super Admin

The Super Admin manages the store-owner accounts and administrative activity.

Typical responsibilities:

View active owner count

Create owners

View owners

Update owners

Delete owners

View administrative logs

Owner

The Store Owner manages their own store data.

Typical responsibilities:

Manage products

Manage customers

Record credit / utang

Record payments / bayad

View balances

View transactions

View dashboard information

6. Store Owners Table

Table

store_owners

Purpose

This table connects an owner profile to their store.

Important columns:

Column

Purpose

id

Store owner/store identifier

profile_id

Connected owner profile

store_name

Store name

branch

Store branch

created_at

Creation timestamp

updated_at

Last update timestamp

Relationship:

profiles
   |
   | profile_id
   v
store_owners

An owner's store_owners.id becomes the store_id used by their store-related records.

For example:

products.store_id
customers.store_id
credit_entries.store_id
payments.store_id

This is important because it allows the database to separate one owner's data from another owner's data.

7. Products Table

Table

products

Purpose

Stores products belonging to a particular store.

Typical columns:

Column

Purpose

id

Product UUID

store_id

Owner/store that owns the product

id_code

Product code

name

Product name

price

Product price

image_url

Product image location, when enabled

status

Active/inactive

created_at

Creation timestamp

updated_at

Last update timestamp

The product belongs to an owner through:

products.store_id
        |
        v
store_owners.id

Product Status

Products use:

active
inactive

An inactive product can remain in the database without being available as an active product.

8. Product Images

Product pictures should be stored in Supabase Storage, not directly as binary data inside PostgreSQL.

Recommended structure:

Supabase Storage
        |
        v
product-images
        |
        v
image file

The products table stores the image URL:

products.image_url

The data flow is:

Owner selects image
        |
        v
React application
        |
        v
Supabase Storage
        |
        v
Image URL
        |
        v
products.image_url

The frontend must not use a service_role key for image uploads.

Storage policies should also prevent an owner from accessing another owner's private product files if the bucket is configured as private.

### Required Supabase setup for product images

Run the following in the Supabase SQL Editor before testing the product image upload. The `current_owner_store_id()` function must already exist because the policy uses it to scope uploads to the authenticated owner's store.

```sql
-- 1. Store only the public URL in PostgreSQL.
alter table public.products
        add column if not exists image_url text;

-- 2. The frontend uses getPublicUrl(), so this bucket must be public.
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do update set public = true;

-- 3. Files are stored as {store_id}/{product_id}/{random-file-name}.
create policy "owners can upload product images"
on storage.objects for insert to authenticated
with check (
        bucket_id = 'product-images'
        and (storage.foldername(name))[1] = public.current_owner_store_id()::text
);
```

The current frontend validates PNG, JPG, and WebP files up to 5 MB. It uploads through the publishable Supabase client, then saves the returned public URL in `products.image_url`. Never use a service-role key in the browser.

### Product image setup checklist

1. Confirm the `products` table exists and add `image_url` with the SQL above.
2. Confirm `public.current_owner_store_id()` returns the logged-in owner's `store_owners.id`.
3. Create or verify the public `product-images` Storage bucket.
4. Add the owner-scoped Storage insert policy.
5. Log in as an owner and upload an image from `/owner/products`.
6. Verify that a file appears under `product-images/{store_id}/{product_id}/`.
7. Verify that the matching `products.image_url` value is saved and the thumbnail appears in the product list.

9. Customers Table

Table

customers

Purpose

Stores customers who buy products on credit.

Customers are records inside the owner's store.

Customers do not need their own login account in the current system design.

Important columns:

Column

Purpose

id

Customer UUID

store_id

Store that owns the customer

customer_code

Automatically generated customer code

name

Customer name

phone_number

Customer phone

address

Customer address

status

Active/inactive

created_at

Creation timestamp

updated_at

Last update timestamp

10. Customer Codes

Customer codes use the format `CUST-XXXXXX`.

PostgreSQL generates the final code with `public.generate_customer_code()` as the column default. A global unique constraint protects the value, and the React application does not preview, increment, or insert customer codes.

See `docs/customer-management-supabase.sql` for the idempotent migration and RLS verification queries.

11. Credit Entries

Table

credit_entries

Purpose

Represents a customer's credit / utang transaction.

Important columns:

Column

Purpose

id

Credit transaction UUID

store_id

Store that created the transaction

customer_id

Customer receiving the credit

total_amount

Total credit amount

due_date

Optional due date

created_at

Transaction date

Relationship:

store_owners
     |
     v
credit_entries
     |
     v
customers

A credit entry belongs to both:

a store

a customer

12. Credit Entry Items

Table

credit_entry_items

Purpose

Stores the individual products included in a credit transaction.

Important columns:

Column

Purpose

id

Item UUID

credit_entry_id

Parent credit transaction

product_id

Product reference

product_name

Product name snapshot

quantity

Quantity purchased

unit_price

Price at transaction time

subtotal

Quantity × unit price

created_at

Creation timestamp

Relationship:

credit_entries
      |
      | 1-to-many
      v
credit_entry_items

The transaction item stores product_name and unit_price as snapshots.

This is useful because a product's current name or price may change later.

For example:

Product today:
Coke
₱20

Credit transaction:
Coke
₱20
quantity 3
subtotal ₱60

If the product later becomes ₱25, the historical transaction can still show the original ₱20 price.

13. Payments Table

Table

payments

Purpose

Stores customer payments / bayad.

Important columns:

Column

Purpose

id

Payment UUID

store_id

Store receiving payment

customer_id

Customer making payment

amount

Payment amount

payment_type

Full or partial

created_at

Payment timestamp

Payment types:

full
partial

Relationship:

customers
    |
    +------> credit_entries
    |
    +------> payments

14. Customer Balance

The customer balance is not stored as a manually edited number.

It is calculated from transactions.

The basic calculation is:

Customer Balance
=
Total Credits
-
Total Payments

For example:

Credits:
₱500
₱300
₱200

Total Credits = ₱1,000

Payments:
₱400

Total Payments = ₱400

Balance = ₱600

This approach reduces the risk of the balance becoming inconsistent with the transaction history.

15. Owner Customer Balances View

The system uses:

owner_customer_balances

This is a database view.

Its purpose is to make customer balance information easier for the application to retrieve.

Conceptually:

customers
    |
    +---- credit_entries
    |
    +---- payments
    |
    v
owner_customer_balances

The application can query the view instead of manually calculating every customer's balance in React.

16. Admin Logs

Table

admin_logs

Purpose

Stores administrative activity performed by administrative users.

Examples of activities include:

login
logout
open dashboard
open Owner Management
create owner
read owner
update owner
delete owner

The purpose is to provide an audit trail for administrative activity.

A log can contain information such as:

admin/user ID

action

affected record

timestamp

additional metadata where supported

The exact columns should match the existing admin_logs schema used by the project.

17. Row Level Security (RLS)

What is RLS?

RLS means:

Row Level Security

Supabase PostgreSQL can use RLS to decide which database rows an authenticated user is allowed to access.

RLS is extremely important for CCLMS because multiple store owners can exist in the same database.

For example:

Owner A
   |
   +--> Store A
          |
          +--> Products A
          +--> Customers A
          +--> Credits A
          +--> Payments A

Owner B
   |
   +--> Store B
          |
          +--> Products B
          +--> Customers B
          +--> Credits B
          +--> Payments B

Owner A must not be able to query Owner B's records.

18. RLS Owner Isolation

The main security concept is:

authenticated user
        |
        v
profiles
        |
        v
store_owners
        |
        v
store_id
        |
        v
owner's records

The database determines the current authenticated user using:

auth.uid()

The user's profile is then associated with a store owner.

The resulting store ID is used to restrict database rows.

19. current_owner_store_id()

The database contains a helper function similar to:

current_owner_store_id()

Its purpose is to determine the store belonging to the currently authenticated owner.

Conceptually:

auth.uid()
    |
    v
profiles.id
    |
    v
store_owners.profile_id
    |
    v
store_owners.id

The returned ID becomes the owner's store ID.

This allows RLS policies to use the same ownership rule consistently.

20. Products RLS

Products are protected so that an owner can only access products belonging to their store.

Conceptually:

products.store_id = current_owner_store_id()

This applies to operations such as:

SELECT

INSERT

UPDATE

DELETE

depending on the policies configured in the database.

The important security rule is:

An owner cannot use the frontend to access another owner's products.

21. Customers RLS

Customers are protected using the same store ownership principle.

Conceptually:

customers.store_id = current_owner_store_id()

Therefore:

Owner A → Customers A
Owner B → Customers B

An owner should not be able to read or modify another owner's customer records.

22. Credit Entries RLS

Credit entries use:

credit_entries.store_id

to identify which store owns the transaction.

The policy verifies that the transaction belongs to the current owner's store.

This prevents an owner from directly querying another owner's credit transactions.

23. Credit Entry Items RLS

Credit entry items are associated with:

credit_entry_id

Instead of having to duplicate ownership information, the database can verify ownership through the parent credit_entries record.

Conceptually:

credit_entry_items
        |
        v
credit_entries
        |
        v
store_id
        |
        v
current owner

This protects transaction items based on the ownership of their parent credit entry.

24. Payments RLS

Payments contain:

payments.store_id

The RLS policy verifies that:

payments.store_id
=
current_owner_store_id()

This prevents owners from reading or creating payments belonging to another store.

25. Why RLS Is Important

Frontend restrictions alone are not enough.

For example, hiding a customer in React does not provide real security.

A malicious user could potentially send their own request to the database.

RLS protects the data at the PostgreSQL level.

The security layers are therefore:

React UI
   |
   v
Supabase Auth
   |
   v
Authenticated session
   |
   v
PostgreSQL RLS
   |
   v
Allowed rows

26. RPC Functions

CCLMS uses PostgreSQL RPC functions for operations that require multiple database steps.

RPC means:

Remote Procedure Call

The React application can call a database function through Supabase.

Example:

supabase.rpc("function_name", parameters)

27. create_credit_entry()

The credit creation RPC is responsible for creating a credit transaction.

Conceptually it:

Identifies the logged-in owner.

Gets the owner's store.

Validates the customer.

Validates the product.

Checks the product belongs to the same store.

Checks the quantity.

Calculates the subtotal.

Creates the credit_entries record.

Creates the credit_entry_items record.

Returns the created transaction.

This is preferable to performing all of these related operations independently in React.

28. create_payment()

The payment RPC is responsible for creating customer payments.

Conceptually it:

Identifies the logged-in owner.

Gets the owner's store.

Validates the customer.

Calculates the customer's current credit total.

Calculates the customer's payment total.

Calculates the current balance.

Checks that the new payment does not exceed the balance.

Creates the payment record.

Returns the created payment.

The application can then refresh the customer balance.

29. Owner Dashboard RPCs

The Owner Dashboard uses database functions to retrieve aggregated data.

Current functions include:

owner_dashboard_totals
owner_credit_ranking
owner_monthly_credit_summary

These functions are used instead of calculating large amounts of data in React.

For example:

Database
   |
   +--> Total credit
   +--> Total payments
   +--> Customer totals
   +--> Credit ranking
   +--> Monthly summary
   |
   v
Owner Dashboard

This keeps the frontend focused on displaying data.

30. Frontend API Layer

The project uses:

src/lib/api/owner.js

as the main Owner-side data access layer.

The general flow is:

Owner Component
       |
       v
ownerApi
       |
       v
Supabase JS
       |
       v
PostgreSQL / RPC / Storage

For example:

const products = await ownerApi.listProducts();

The component does not need to know all of the database query details.

31. Product Data Flow

Product loading:

Product Management
       |
       v
ownerApi.listProducts()
       |
       v
Supabase
       |
       v
products table
       |
       v
React UI

Product creation:

Product Form
       |
       v
ownerApi.createProduct()
       |
       v
Supabase
       |
       v
products

32. Customer Data Flow

Customer loading:

Customer Management
       |
       v
ownerApi.listCustomers()
       |
       v
owner_customer_balances
       |
       v
Customer UI

Customer creation:

Customer Form
       |
       v
ownerApi.createCustomer()
       |
       v
customers
       |
       v
Database-generated customer code

33. Credit Data Flow

Credit Form
     |
     v
ownerApi.createCredit()
     |
     v
create_credit_entry RPC
     |
     +----> credit_entries
     |
     +----> credit_entry_items
     |
     v
Updated customer balance

34. Payment Data Flow

Payment Form
     |
     v
ownerApi.createPayment()
     |
     v
create_payment RPC
     |
     v
payments
     |
     v
Updated customer balance

35. Balance Data Flow

credit_entries
       |
       | total credits
       v
     SUM
       |
       |
       +----------------+
                        |
                        v
                     BALANCE
                        ^
                        |
       +----------------+
       |
       | total payments
       v
     SUM
       |
       v
payments

Formula:

Balance = Credits - Payments

36. Database Security Rules

The following rules should always be followed:

Rule 1 — Never use service_role in React

Do not put the Supabase service-role key in frontend code.

Rule 2 — Do not disable RLS

RLS should remain enabled for protected application tables.

Rule 3 — Always identify the current owner

Owner data must be associated with the authenticated user's store.

Rule 4 — Do not trust frontend ownership values

The frontend should not be trusted to decide which store_id an owner can access.

The database/RLS should enforce ownership.

Rule 5 — Keep transaction history

Credits and payments should be recorded as transactions instead of simply overwriting a customer's balance.

Rule 6 — Use database-generated identifiers where appropriate

Customer codes and UUIDs should be generated by the database.

Rule 7 — Use RPCs for multi-step financial operations

Credit and payment operations should use their database functions so validation and insertion happen together.

37. Why the Balance Is Not Manually Stored

The system does not need a manually maintained field such as:

customers.balance

because the balance can be derived from the transaction history.

This prevents problems such as:

Database says:
Balance = ₱500

But transaction history says:
Credits = ₱1,000
Payments = ₱200

Actual balance = ₱800

By calculating the balance from transactions, the database has a consistent source of truth.

38. Data Ownership Example

Suppose there are two owners:

Owner A
Store ID: AAA

Owner B
Store ID: BBB

Products:

Product 1 → store_id AAA
Product 2 → store_id BBB

Customers:

Customer A → store_id AAA
Customer B → store_id BBB

When Owner A logs in:

current_owner_store_id()
        |
        v
AAA

Therefore Owner A can access:

Product 1
Customer A
Credits belonging to Store AAA
Payments belonging to Store AAA

Owner A should not be able to access:

Product 2
Customer B
Store BBB transactions

This is the purpose of the RLS ownership policies.

39. Recommended Application Structure

The application should maintain this separation:

UI Components
      |
      v
API Layer
      |
      v
Supabase
      |
      +------------------+
      |                  |
      v                  v
PostgreSQL           Storage
      |
      v
RLS / RPC

For Owner functionality:

src/lib/api/owner.js

should remain the main place for Owner database operations.

40. Adding New Database Features

When adding a new feature:

Determine whether a new table is required.

Define the table relationships.

Add foreign keys.

Add appropriate indexes/constraints.

Enable RLS where appropriate.

Create RLS policies.

Create RPC functions if the operation requires multiple database steps.

Add the corresponding API function.

Connect the React UI.

Test using an authenticated account.

Test that one owner cannot access another owner's records.

Do not start by bypassing RLS just to make the frontend work.

41. Database Source of Truth

The database should be considered the source of truth for:

Users

Roles

Owners

Products

Customers

Credits

Credit items

Payments

Customer balances

Administrative activity

React is responsible for displaying and interacting with this data.

Supabase/PostgreSQL is responsible for storing, validating, and protecting it.

42. Summary

The CCLMS database is designed around store ownership.

The most important relationship is:

Authenticated User
        |
        v
Profile
        |
        v
Store Owner
        |
        v
Store ID
        |
        +------ Products
        |
        +------ Customers
        |
        +------ Credit Entries
        |
        +------ Payments

Customer balances are derived from:

Total Credits - Total Payments

RLS ensures that owners can only access data belonging to their own store.

RPC functions handle important multi-step operations such as:

create_credit_entry
create_payment
owner_dashboard_totals
owner_credit_ranking
owner_monthly_credit_summary

The React application communicates with this database through:

src/lib/api/owner.js

This architecture keeps the CCLMS application organized, secure, and scalable as additional features are added.