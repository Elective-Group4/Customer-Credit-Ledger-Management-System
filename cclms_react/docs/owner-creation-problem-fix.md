# CCLMS - Owner Management Fixes

This document records the database fix for Create Owner and the shared Edge
Function flow now used by Create, Edit, and Delete.

## Problem

When creating a Store Owner from the **Owner Management** page, the request initially failed with:

```text
FunctionsHttpError: Edge Function returned a non-2xx status code
```

The Supabase Edge Function was successfully reaching Supabase Auth, but the owner profile could not be inserted into the `profiles` table.

---

## 1. Authentication Was Working

The Edge Function successfully created the Auth account.

Example:

```text
AUTH CREATE DATA: {
  user: {
    id: "...",
    email: "nel@gmail.com",
    ...
  }
}
```

This confirmed that:

- The admin session was valid.
- The Edge Function authorization was working.
- The `service_role` configuration was working.
- Supabase Auth could create the new owner account.

---

## 2. The Actual Error

The important error was:

```text
PROFILE CREATE ERROR: {
  code: "23514",
  message: "new row for relation \"profiles\" violates check constraint \"profiles_role_check\""
}
```

The failing row contained:

```text
role = owner
```

The problem was that the existing `profiles_role_check` constraint did not allow the value:

```text
owner
```

Therefore, Supabase Auth created the user successfully, but PostgreSQL rejected the corresponding `profiles` row.

---

## 3. Database Fix

Open:

**Supabase → SQL Editor**

Run:

```sql
ALTER TABLE public.profiles
DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE public.profiles
ADD CONSTRAINT profiles_role_check
CHECK (
  role IN ('admin', 'owner')
);
```

This makes the allowed profile roles:

```text
admin
owner
```

---

## 4. Edge Function Role

The `smart-action` Edge Function should create Store Owners with:

```ts
role: "owner",
```

Example:

```ts
const {
  data: newProfile,
  error: newProfileError,
} = await serviceClient
  .from("profiles")
  .insert({
    id: profileId,
    full_name: fullName,
    email,
    phone_number: phoneNumber,
    role: "owner",
    status,
  })
  .select()
  .single()
```

Do not change this back to another role value unless the database constraint and the rest of the application are changed consistently.

---

## 5. Important Rollback Behavior

The Edge Function creates the Auth account before creating the `profiles` row.

If profile creation fails, the Auth account should be deleted so that an incomplete owner account is not left behind.

```ts
if (newProfileError) {
  console.error(
    "Profile creation failed. Rolling back Auth user."
  )

  await serviceClient.auth.admin.deleteUser(
    profileId
  )

  return response(
    {
      success: false,
      message: newProfileError.message,
    },
    400
  )
}
```

This prevents an Auth user from remaining when the profile creation fails.

---

## 6. Store Owner Creation

After the profile is successfully created, the Edge Function creates the `store_owners` record:

```ts
const {
  data: storeOwner,
  error: storeOwnerError,
} = await serviceClient
  .from("store_owners")
  .insert({
    profile_id: profileId,
    store_name: storeName,
    branch,
  })
  .select()
  .single()
```

If this fails, the function rolls back the profile and Auth account.

```ts
if (storeOwnerError) {
  await serviceClient
    .from("profiles")
    .delete()
    .eq("id", profileId)

  await serviceClient.auth.admin.deleteUser(
    profileId
  )

  return response(
    {
      success: false,
      message: storeOwnerError.message,
    },
    400
  )
}
```

---

## 7. Admin Log

After the owner is successfully created, the Edge Function records the admin action:

```ts
const {
  data: adminLog,
  error: adminLogError,
} = await serviceClient
  .from("admin_logs")
  .insert({
    admin_id: adminUser.id,
    action: "CREATE_OWNER",
    target_user_id: profileId,
    target_name: fullName,
  })
  .select()
  .single()
```

The resulting log should contain:

```text
action          = CREATE_OWNER
admin_id        = current admin ID
target_user_id  = newly created owner ID
target_name     = owner name
```

---

## 8. Edit and Delete Flow

The frontend invokes the existing `smart-action` function for all
server-sensitive owner operations. It does not call `/api/...`, localhost
endpoints, or separate update/delete function URLs.

### Edit Owner

The function receives `action: "update_owner"` and verifies:

- The caller is an authenticated admin.
- The target profile exists and has role `owner`.
- The supplied `store_owner_id` belongs to the supplied `profile_id`.

It then updates:

```text
profiles:     full_name, email, phone_number, status
store_owners: store_name, branch
```

When the email changes, the function updates the Supabase Auth user with its
server-side service client and keeps `profiles.email` synchronized. The
service-role key is never exposed in React or Vite environment variables.

### Delete Owner

The function receives `action: "delete_owner"` and verifies that the target
is an owner and is not the current administrator. It removes, in order:

```text
store_owners record
profiles record
Supabase Auth user
```

If a later deletion step fails, the function attempts to restore the records
already removed and returns the error to the frontend. The frontend refreshes
the owner list after a successful deletion.

## 9. Final Working Flow

The successful Owner Management creation flow is:

```text
Admin Login
     ↓
Verify Admin Role
     ↓
Create Supabase Auth User
     ↓
Create profiles Row
     ↓
Create store_owners Row
     ↓
Create CREATE_OWNER Admin Log
     ↓
Return Success
```

Expected result:

```text
Authentication User     ✅
profiles Row            ✅
store_owners Row        ✅
admin_logs Row          ✅
```

---

## 10. Testing

When testing again, use a new email if an earlier test already created the Auth account.

Example:

```text
Name: Nelson Mark Panganiban
Email: nelson2@gmail.com
Password: 123456
Phone: 09123456789
Store Name: Nelson Sari-Sari Store
Branch: Main Branch
Status: Active
```

Then verify the following locations in Supabase:

### Authentication

**Supabase → Authentication → Users**

The new owner should appear.

### Profiles

```sql
SELECT *
FROM public.profiles
WHERE role = 'owner'
ORDER BY created_at DESC;
```

### Store Owners

```sql
SELECT *
FROM public.store_owners
ORDER BY created_at DESC;
```

### Admin Logs

```sql
SELECT *
FROM public.admin_logs
ORDER BY created_at DESC;
```

A successful creation should have a:

```text
CREATE_OWNER
```

log entry.

---

## 11. Key Lesson

The original error looked like an Edge Function failure, but the actual problem was a PostgreSQL check constraint.

The important error code was:

```text
23514
```

which indicated that the inserted value violated the existing:

```text
profiles_role_check
```

constraint.

The fix was to make the database role constraint match the application's role values:

```text
admin
owner
```

After this change, Store Owner creation worked successfully.
