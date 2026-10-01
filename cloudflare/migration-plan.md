# DZCORE backend migration

## Target

Remove the runtime dependency on the locked Appwrite project without touching the old project or the live `dzcore.top` domain until the replacement is verified.

## Cloudflare architecture

- **Pages:** existing `dzcore` project and static Vite build.
- **Pages Functions:** `functions/api/[[path]].js`, exposing `/api/*` on the same origin.
- **D1:** `dzcore-db` (`5e0f2d7a-358c-41cf-851e-94b9a7bae8f8`) in EU jurisdiction.
- **Data model:** `auth_users` and `auth_sessions` for authentication; `entities` stores the existing JSON-shaped social objects so the frontend can migrate incrementally.
- **Media:** keep the current local cache during the first pass; move large avatar/banner/media values to R2 before production cutover.

## Safety boundary

The old Appwrite project remains untouched. The Cloudflare backend is tested on the Pages deployment before the frontend stops calling Appwrite. Existing production deployment and domain remain unchanged until the new account flow and entity synchronization are verified.
