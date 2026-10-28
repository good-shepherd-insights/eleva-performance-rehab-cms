# Project Context

## Company Policy

Read and follow [COMPANY_POLICY.md](COMPANY_POLICY.md) before using this
project context or making changes. Company policy is mandatory and violations
are blocking issues.

## Project

Payload CMS backend for a multilingual website (locales come from
configuration). It is a standalone Next.js host for Payload at the
repository root — there is no separate `apps/` split in this repo.

## Repository Scope

This repository is the Payload CMS only. The public site is maintained
separately in `the website repository`, which reads this CMS
over its REST API, and (for approved MCP clients) its MCP endpoint.

This CMS supplies:

1. Site shell data — brand (logo/logo alt/favicon) and accessibility labels
   (the configured site global, `SITE_GLOBAL_SLUG`).
2. Reusable global components — the `components` collection (one document
   per component, each holding an open `sections` blocks field), curated
   onto every page through the site global's ordered `components` list.
3. Per-page content — each page's `sections` blocks
   (`pages` collection, one document per slug). All blocks fields ship
   open (`blocks: []`); no block kinds are predefined, each project
   registers its own.
4. Media uploads and their metadata.
5. Localized data (locales configured via `CMS_LOCALES`/`CMS_DEFAULT_LOCALE`)
   for both of the above.
6. Live Preview data and URLs for the website's preview iframe.
7. Admin authentication, via standard Payload email/password auth.

## Runtime Architecture

1. Next.js hosts the Payload admin, REST/GraphQL API, and MCP endpoint
   (`src/app`, `src/payload.config.ts`).
2. **Collections** (`src/collections/`): `Users` (standard Payload
   email/password auth), `Media`, `Components` (reusable component
   documents), `Pages` (the per-page content collection).
3. **Globals** (`src/globals/`): `SiteGlobals` (`src/globals/SiteGlobals.ts`)
   — `brand`, an `accessibility` label group, and a `components` array
   (ordered relationships to `components` documents); slug required from
   `SITE_GLOBAL_SLUG` (no default).
4. **Database:** MongoDB (`@payloadcms/db-mongodb`, `mongooseAdapter`,
   reads `MONGODB_URL`) — set in `payload.config.ts`. No schema push or
   structural migrations; field changes take effect from config alone.
5. **Media storage:** Vercel Blob (`vercelBlobStorage` plugin,
   `BLOB_READ_WRITE_TOKEN`), not local disk.
6. **Auth:** standard Payload email/password auth on `Users`, plus
   optional passkey sign-in (`src/auth/passkeys.ts`, `PasskeyLogin.tsx`,
   `PasskeyManager.tsx`) that issues the same Payload session.
   **Admin branding:** `src/admin/Logo.tsx` (login logo) and
   `src/admin/Icon.tsx` (nav icon) read the site global's `brand.logo` /
   `brand.favicon` uploads and fall back to Payload's defaults when unset.
7. **Localization:** declared once via `CMS_LOCALES`/`CMS_DEFAULT_LOCALE`
   (parsed in `src/config/runtime.ts`, passed to
   `payload.config.ts`'s `localization`) and exposed at a custom `/locales`
   endpoint the website calls at build time. Do not hand-maintain a second
   locale list on either side.
8. **Live Preview:** `payload.config.ts`'s `livePreview.url` builds the
   website preview URL per document via `getAstroPreviewURL`: the default
   locale is unprefixed for every page (`/`, `/<slug>`), other locales are
   prefixed (`/<locale>/`, `/<locale>/<slug>`), and `slug: "home"` maps to
   the locale root. This must track the website's
   actual route shape — a route change on the website side needs a
   matching change here.
9. **Inline edit bridge:** `src/admin/livePreviewConfig.ts` /
   `InlinePreviewBridge.tsx` — only mounted when
   `ENABLE_INLINE_EDIT_BRIDGE=true` (documented in `.env.example`).
10. **MCP:** `@payloadcms/plugin-mcp`, scoped per resource in
    `payload.config.ts` — `Pages` (`create`/`find`/`update` enabled), the
    configured site global (`find`/`update` enabled). Not a blanket grant.
11. **Deploy webhook:** publishing a `pages` document (not a draft save)
    fires `WEBSITE_DEPLOY_WEBHOOK_URL` (`Pages.ts`, `afterChange`
    hook) — this is what triggers a website rebuild.

## System Design

End-to-end, across both repositories:

1. An editor authenticates to the CMS admin with standard Payload
   email/password credentials.
2. They edit the configured site global (`SiteGlobals`, brand/
   accessibility/components curation), a `components` document, or a
   `pages` document (page content). All are versioned with drafts
   (`versions.drafts`), but not identically: the site global autosaves
   every 800ms (`versions.drafts.autosave.interval`, `SiteGlobals.ts`);
   `pages` and `components` have `versions.drafts: true` with no autosave
   config — don't assume they autosave the same way.
3. Editing a `pages` document renders the website's actual `Layout`/
   `PageView` inside Payload's own Live Preview iframe, wired by
   `livePreview.url` (item 8 above) plus the website's
   `InlinePreviewBootstrap.astro` / `data-inline-edit` attributes on the
   other side of that same bridge.
4. Publishing a `pages` document (not draft-saving) fires the deploy
   webhook (item 11 above).
5. The website's build fetches the site global from
   `/api/globals/<SITE_GLOBAL_SLUG>` and `Page` documents from `/api/pages`,
   validates them
   (`isCompletePage`/`hasLocalizedPageData` in the website's `payload.ts`),
   and renders through `PageView.astro`.
6. Separately, an MCP client with an approved API key can read/write
   `Pages` and the configured site global directly (item 10 above), bypassing
   the admin UI. `Pages.ts` only defines `access: { read: () => true }` —
   no explicit `create`/`update` access function — so what governs
   MCP/API write access there is Payload's own default collection access
   behavior. Not verified here against Payload's docs; don't assume it
   matches the admin UI's behavior without checking.

A schema change on the CMS side (a global field, or a block kind a project
registers) that isn't mirrored in the website's `payload.ts` types breaks
step 5 — see `COMPANY_POLICY.md` Project Rule 3 / Banned rule 4.

## Content Model

Mirrors the split in `payload.config.ts`'s `collections`/`globals`:

**Site global** (slug from `SITE_GLOBAL_SLUG`), exported as `SiteGlobals`
(`src/globals/SiteGlobals.ts`):

1. `brand` — logo, logo alt text, favicon.
2. `accessibility` — shell labels (primary nav, skip link, menu, language
   switch, home link suffix).
3. `components` — an ordered array of relationships to `components`
   documents; this curation renders globally on every page, in this order.

**`components` collection** (`src/collections/Components.ts`) — one document
per reusable component (unique slug + title), each holding a `sections`
blocks field with the same generic validation as Pages. A project registers
its own block kinds and composes them here.

**`pages` collection** (`src/collections/Pages.ts`) — one document per slug,
a `sections` blocks field. `validateSections` enforces: at least one section,
and each section carries a string `blockType`. No block kinds are shipped;
a project registers its own kinds in the `blocks` array in its own copy —
that registration is the one mechanism for adding a section type; see
`COMPANY_POLICY.md` Project Rule 3.

## Known Gaps (verified in source, not fixed here)

1. **Write access is unverified for both `Pages` and `SiteGlobals`, not
   confirmed safe.** `src/collections/Pages.ts` and `src/globals/SiteGlobals.ts`
   both define `access: { read: () => true }` only — neither has an explicit
   `create`/`update` (or `write`, for the global) access function. What
   actually governs who can write to either — admin session, MCP key, or
   anyone — is whatever Payload's own default access resolves to when
   unspecified. Not checked against Payload's docs here — do not assume it
   requires authentication, and do not assume it doesn't, before verifying
   against current Payload docs or a real request.
2. **Publishing the site global does not rebuild the website — only
   publishing a `pages` document does.** `src/globals/SiteGlobals.ts` has no
   `hooks` block at all (grep-verified: no `afterChange`, no reference to
   `WEBSITE_DEPLOY_WEBHOOK_URL`); only `src/collections/Pages.ts`
   has the deploy-webhook `afterChange` hook. An editor who changes and
   publishes brand/accessibility/components content and expects the live
   site to update will not see it until something else triggers a rebuild
   (e.g. a `pages` document is also published, or a manual deploy). Not
   fixed here — this may be intentional (shell changes rarer, bundled
   with other work) or an oversight; don't assume either without asking.

## Development

1. Install dependencies with `pnpm install` (Node.js 20+, pnpm 9+).
2. Run the CMS with `pnpm dev` — admin at the configured `CMS_ORIGIN`
   with `/admin`.
3. Regenerate types after a schema change: `pnpm generate:types`.
4. Regenerate the import map after adding/removing an admin component:
   `pnpm generate:importmap`.
5. Run a data migration (only when existing documents must be reshaped): `pnpm migrate`. The template ships no tests; a project
   adds its own if it wants them.

## Out Of Scope

1. This repository should not become the source of truth for website
   routing, rendering, or design-system decisions — those belong in
   `the website repository`.
