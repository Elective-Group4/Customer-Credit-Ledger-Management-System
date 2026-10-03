# CCLMS Per-User Dark Mode Persistence Fix

## Overview

This document records how the per-user Light/Dark Mode persistence issue
in the Customer Credit Ledger Management System (CCLMS) was diagnosed
and fixed.

The application uses:

-   React with Vite (JavaScript/JSX)
-   Supabase Authentication and database
-   `next-themes` for theme switching
-   A `profiles.theme_preference` column to store each account's
    preference
-   Two account roles: `admin` and `owner`

The intended behavior is for each authenticated account to retain its
own theme preference after refresh and after logging out and signing
back in.

## The problem

When a user selected Dark Mode, the interface briefly changed to dark
and then reverted to Light Mode.

The browser console showed that the theme-loading process was running
again after the theme changed. The logs included this sequence:

``` text
SAVE CHECK:
{userId: true, preferenceLoaded: true, refLoaded: false, theme: 'dark', loadedTheme: null}

SAVE CHECK:
{userId: true, preferenceLoaded: false, refLoaded: false, theme: 'dark', loadedTheme: null}

SAVE CHECK:
{userId: true, preferenceLoaded: true, refLoaded: false, theme: 'light', loadedTheme: null}

SAVE CHECK:
{userId: true, preferenceLoaded: false, refLoaded: false, theme: 'light', loadedTheme: null}

SAVE CHECK:
{userId: true, preferenceLoaded: true, refLoaded: true, theme: 'light', loadedTheme: 'light'}
```

This showed that the theme temporarily became `dark`, then the
preference-loading process ran again and the interface returned to
`light`.

The issue was not simply the appearance toggle. The loading and saving
effects needed to coordinate so that an old database preference would
not overwrite a manual theme selection.

## Supabase setup

The saved preference is stored in:

``` text
profiles.theme_preference
```

The application uses this RPC function to update the authenticated
user's preference:

``` sql
CREATE OR REPLACE FUNCTION public.set_my_theme_preference(
    p_theme_preference TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'User is not authenticated';
    END IF;

    IF p_theme_preference NOT IN ('light', 'dark') THEN
        RAISE EXCEPTION 'Invalid theme preference';
    END IF;

    UPDATE public.profiles
    SET theme_preference = p_theme_preference
    WHERE id = auth.uid();

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Profile not found';
    END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.set_my_theme_preference(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.set_my_theme_preference(TEXT) TO authenticated;
```

The function is `SECURITY DEFINER` and owned by `postgres`. Row Level
Security remains enabled on `profiles`; the fix does not require
disabling RLS or weakening its policies.

## ThemeProvider configuration

The theme provider uses a user-specific React key and storage key. This
isolates the browser-side theme state for each account.

``` jsx
<ThemeProvider
  key={userId || "signed-out"}
  attribute="class"
  storageKey={`cclms.theme.${userId || "signed-out"}`}
  defaultTheme="light"
  enableSystem={false}
>
  <AccountThemePersistence userId={userId}>
    {children}
  </AccountThemePersistence>
</ThemeProvider>
```

Keep `AccountThemePersistence` inside `ThemeProvider`, because it uses
`useTheme()`.

## Claude's implementation

The following is the implementation Claude provided to replace the
previous `AccountThemePersistence` function:

``` jsx
function AccountThemePersistence({ userId, children }) {
  const { theme, setTheme } = useTheme();

  // Keep latest values in refs so effects don't depend on next-themes' changing setTheme
  const setThemeRef = useRef(setTheme);
  setThemeRef.current = setTheme;
  const themeRef = useRef(theme);
  themeRef.current = theme;

  // State resets automatically on account switch because ThemeProvider is keyed by userId
  const [loadedUserId, setLoadedUserId] = useState(null);
  const [savedTheme, setSavedTheme] = useState(null); // what the DB currently holds ("light" | "dark")
  const savingRef = useRef(false);

  const preferenceLoaded = !userId || loadedUserId === userId;

  // 1) Load the saved preference ONCE per user
  useEffect(() => {
    if (!userId) {
      setThemeRef.current("light");
      return;
    }

    let cancelled = false;
    const themeAtRequestStart = themeRef.current;

    async function loadThemePreference() {
      const { data, error } = await supabase
        .from("profiles")
        .select("theme_preference")
        .eq("id", userId)
        .single();

      if (cancelled) return;

      let baseline;

      if (error) {
        console.error("Failed to load theme preference:", error);
        // Don't overwrite the DB with a default; later manual changes can still save.
        baseline = themeRef.current === "dark" ? "dark" : "light";
      } else {
        baseline = data?.theme_preference === "dark" ? "dark" : "light";

        // Don't override a manual selection made while loading
        if (themeRef.current === themeAtRequestStart) {
          setThemeRef.current(baseline);
        }
      }

      setSavedTheme(baseline);
      setLoadedUserId(userId);
    }

    loadThemePreference();

    return () => {
      cancelled = true;
    };
  }, [userId]); // intentionally NOT depending on setTheme

  // 2) Save only when the theme differs from what the DB holds
  useEffect(() => {
    if (
      !userId ||
      !preferenceLoaded ||
      savedTheme === null ||
      !["light", "dark"].includes(theme) ||
      theme === savedTheme ||
      savingRef.current
    ) {
      return;
    }

    const themeToSave = theme;
    savingRef.current = true;

    async function saveThemePreference() {
      // Local session check (no network): make sure the session still belongs to this user
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.user?.id !== userId) {
        savingRef.current = false;
        return;
      }

      const { error } = await supabase.rpc("set_my_theme_preference", {
        p_theme_preference: themeToSave,
      });

      savingRef.current = false;

      if (error) {
        console.error("Failed to save theme preference:", error);
        return;
      }

      // Updating this re-runs the effect, so a toggle made mid-save is saved next
      setSavedTheme(themeToSave);
    }

    saveThemePreference();
  }, [userId, preferenceLoaded, theme, savedTheme]);

  if (!preferenceLoaded) return null;

  return children;
}
```

## Required imports

Make sure `App.jsx` imports the hooks used by the function:

``` jsx
import { useEffect, useRef, useState } from "react";
```

It also needs the existing imports for `useTheme`, `ThemeProvider`, and
the Supabase client, according to the project's current file structure.

## What the implementation changes

### Loading the preference

-   Reads `theme_preference` from the signed-in user's own `profiles`
    row.
-   Runs the loading effect when `userId` changes.
-   Uses a ref for the latest `setTheme` function, so the loading effect
    does not need `setTheme` in its dependency array.
-   Records the theme present when the database request starts.
-   Applies the database preference only if the current theme has not
    changed while the request was pending.
-   Marks the preference as loaded for that user.

### Saving a changed preference

-   Waits until the preference has loaded.
-   Saves only when the current theme differs from the loaded/saved
    theme.
-   Checks the current Supabase session before saving, to ensure the
    session user matches the account being handled.
-   Calls `set_my_theme_preference` with the selected `light` or `dark`
    value.
-   Updates `savedTheme` after a successful save so the effect can
    detect any subsequent change.

### Separating accounts

The `ThemeProvider` key and storage key include the authenticated
`userId`. This gives each account a separate provider instance and
browser storage entry. The Supabase profile row remains the persistent
source of truth for the preference.

## Testing checklist

Test with both an admin account and an owner account.

-   [ ] Admin selects Dark Mode; the interface stays dark.
-   [ ] Refresh while logged in as admin; Dark Mode remains selected.
-   [ ] Confirm the admin's `profiles.theme_preference` is `dark`.
-   [ ] Owner selects Light Mode; the interface stays light.
-   [ ] Refresh while logged in as owner; Light Mode remains selected.
-   [ ] Confirm the owner's `profiles.theme_preference` is `light`.
-   [ ] Log out and log back in as admin; the admin's preference is
    restored.
-   [ ] Log out and log back in as owner; the owner's preference is
    restored.
-   [ ] Switch between accounts and confirm one account's preference
    does not affect the other.

## Final result

The issue was fixed by using Claude's revised `AccountThemePersistence`
implementation together with the account-specific `ThemeProvider`
configuration. The user tested the updated implementation and confirmed
that it was working.

Keep this implementation as the working baseline. If theme persistence
is changed later, retest both roles, refresh behavior, and account
switching.
