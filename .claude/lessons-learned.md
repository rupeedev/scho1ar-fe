# Lessons Learned - Critical Incidents

This document captures critical lessons from past incidents to prevent future mistakes.

---

## Incident: Railway Nixpacks Cache Mount Error (2026-01-19)

### What Happened

Railway builds failed with "Device or resource busy" error when trying to remove the node_modules cache:

```
rm: cannot remove 'node_modules/.cache': Device or resource busy
ERROR: failed to build: process did not complete successfully: exit code: 1
```

### Root Cause

**Nixpacks mounts the cache directory as a Docker volume mount** (`--mount=type=cache`), which cannot be removed with `rm -rf`.

The build command `rm -rf node_modules/.cache && npm run build` tried to remove the cache, but Docker volume mounts cannot be deleted from within the container.

### How It Was Fixed

1. Created `nixpacks.toml` to disable cache mounts:
   ```toml
   [phases.build]
   cmds = ["npm run build"]
   cacheDirectories = []
   ```

2. Updated `railway.json` to use the nixpacks config:
   ```json
   {
     "build": {
       "builder": "NIXPACKS",
       "nixpacksConfigPath": "nixpacks.toml"
     }
   }
   ```

### Prevention

- **Never try to remove Docker cache mounts** - they're managed by Docker
- **Use nixpacks.toml to control build behavior** instead of buildCommand hacks
- **Test Railway builds** after any config changes

---

## Incident: Clerk Auth Migration (2026-01-19)

### What Happened

Application was using Supabase Auth but needed to migrate to Clerk for better authentication features.

### Key Changes Made

1. **Replaced `useSupabaseAuth` with `useClerkAuth`** across all components
2. **Updated Sidebar.tsx** to use Clerk user properties (fullName, firstName, imageUrl)
3. **Updated password components** to use Clerk's `openUserProfile()` instead of Supabase
4. **Updated API client** to use `authTokenManager` pattern for JWT tokens
5. **Cleaned up supabase.ts** to remove all auth functions

### Files Changed

| File | Change |
|------|--------|
| `src/hooks/use-clerk-auth.tsx` | Created new Clerk auth hook |
| `src/lib/auth-token.ts` | Token manager for API client |
| `src/components/Sidebar.tsx` | Switched to Clerk user data |
| `src/components/ChangePasswordModal.tsx` | Uses Clerk profile |
| `src/components/PasswordResetButton.tsx` | Uses Clerk profile |
| `src/pages/ResetPassword.tsx` | Redirects to login |
| `src/pages/ProfileDetails.tsx` | Uses Clerk user properties |
| `src/lib/supabase.ts` | Removed auth functions |

### Prevention

- **Always update all components** when changing auth providers
- **Search for old hook usage** with grep before marking complete
- **Test auth flow end-to-end** after migration

---

## Template for Future Incidents

### Incident: [Title] (Date)

**What Happened:**
- Brief description

**Root Causes:**
- List of causes

**How It Was Fixed:**
- Steps taken

**Prevention:**
- What to do differently next time

---

## Quick Reference

| Incident | Issue | Key Prevention |
|----------|-------|----------------|
| Railway Cache | Docker mount can't be deleted | Use nixpacks.toml to disable cache |
| Clerk Migration | Auth inconsistency | Update ALL components using auth |
