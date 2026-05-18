# OMG3Q Project Agent Notes

Use these local project rules instead of installing global skills for this repo.

## Stack

- App: Next.js App Router, React, TypeScript.
- Backend/data: Supabase database and Supabase Storage.
- Main app path: `web/`.
- Admin CMS upload flow lives under `web/src/components/admin` and `web/src/app/api/admin`.

## Before Editing

- Read `web/AGENTS.md` before changing Next.js code.
- Prefer existing helpers in `web/src/lib` before adding new abstractions.
- Do not install global Codex skills or global npm packages for this project.
- Keep admin/service-role logic server-side only. Never expose `SUPABASE_SERVICE_ROLE_KEY` to client code.

## Validation

Run these from `web/` after code changes when relevant:

```bash
npm run lint
npm run build
```

For UI/admin workflow changes, use a browser check when possible and verify mobile layout because admins commonly upload from phones.

## Uploads

- Prefer client-side image optimization before requesting upload tickets.
- Prefer Supabase resumable/TUS upload for unstable mobile networks.
- Keep signed upload paths under `accounts/`.
- Keep gallery state and thumbnail selection in sync with `account_images` and `accounts.thumbnail_url`.
