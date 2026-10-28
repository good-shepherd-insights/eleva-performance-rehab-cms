# Payload CMS Template

Payload CMS backend for a multilingual website. This is a standalone Payload application at the repository root, consumed by a separate Astro frontend through its REST API and MCP endpoint. All runtime configuration comes from the environment contract documented below.

## What this manages

- Multilingual site shell (locales come from `CMS_LOCALES`) — brand and
  accessibility labels in the configured site global (`SITE_GLOBAL_SLUG`),
  plus an ordered `components` curation list that renders globally on every
  page
- Reusable global components — the `components` collection, one document
  per component, each holding an open `sections` blocks field
- Multilingual per-page content — a `sections` blocks field — in the `pages`
  collection, one document per slug. All blocks fields ship open
  (`blocks: []`); no block kinds are predefined, each project registers its
  own in its own copy.
- Media uploads (stored in Vercel Blob, not local disk)
- Standard Payload admin authentication (email/password)
- MCP access, scoped per resource (`Pages`: create/find/update; the
  configured site global: find/update) at `/api/mcp`

The Astro frontend is a separate repository that consumes this CMS's REST API.

## Local development

Requirements: Node.js 20 or newer and pnpm 9 or newer.

```bash
cp .env.example .env
pnpm install
pnpm dev
```

Open the configured CMS origin with `/admin` to use the CMS.

Media is stored in Vercel Blob (`BLOB_READ_WRITE_TOKEN`), not local disk.

## Environment variables

| Variable | Purpose |
| --- | --- |
| `CMS_ORIGIN` | Public CMS origin, used for CMS URLs, CORS, and CSRF |
| `SITE_ORIGIN` | Public website origin, used for Live Preview, CORS, and CSRF |
| `SITE_GLOBAL_SLUG` | Identifier for the shared site global |
| `CMS_LOCALES` | JSON array of locale objects with `code`, `label`, and optional `rtl` |
| `CMS_DEFAULT_LOCALE` | Locale code from `CMS_LOCALES` used as the default locale |
| `MONGODB_URL` | MongoDB connection string (database name in the path) |
| `PAYLOAD_SECRET` | Secret used to sign Payload sessions and tokens |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob token for media storage |
| `ENABLE_INLINE_EDIT_BRIDGE` | Set to `true` to mount the inline click-to-edit Live Preview bridge |
| `WEBSITE_DEPLOY_WEBHOOK_URL` | Optional endpoint called when a `pages` document is published |

Set every required value in an untracked `.env`; never commit secrets.

## Useful commands

```bash
pnpm dev                 # Start the Payload admin and API
pnpm build               # Build the production application
pnpm start               # Serve the production build
pnpm lint                # Run ESLint
pnpm generate:types      # Regenerate src/payload-types.ts
pnpm generate:importmap  # Regenerate the Payload import map
```

## API and MCP

The REST API is available under `/api`. The site shell (brand,
accessibility, curated components) is read from the
configured site global (`SITE_GLOBAL_SLUG`) by locale — shown here with the
placeholder `<global-slug>`:

```text
/api/globals/<global-slug>?depth=1&locale=<locale>
```

Per-page content is read from the `pages` collection, optionally filtered
by slug:

```text
/api/pages?depth=1&locale=<locale>&where[slug][equals]=home
```

The official Payload MCP plugin is mounted at `/api/mcp`, scoped in
`payload.config.ts` to the `Pages` collection (create/find/update) and the
configured site global (find/update) — not a blanket grant. Create an MCP API
key in **Admin → MCP → API Keys**, grant only the required capabilities,
and provide it to an MCP client as:

```text
Authorization: Bearer YOUR_MCP_API_KEY
```

The Astro frontend uses the Payload API during development and can use the same public CMS URL for production builds and authenticated Live Preview.

## Project structure

```text
src/
├── collections/       Users, Media, Components, Pages
├── globals/            SiteGlobals — brand, accessibility labels, ordered components curation
├── admin/               Payload admin components and Live Preview helpers
├── config/              runtime.ts — the required environment contract
├── app/                 Next.js routes for the admin, API, and MCP
└── payload.config.ts    Localization, database, CORS/CSRF, Live Preview, MCP
```

## Deployment

Deploy this repository as a standalone Next.js/Payload application. Configure the required environment contract before deployment; the website must be able to reach `CMS_ORIGIN` over HTTPS.

Back up the Postgres database and Blob media independently before enabling editorial writes on a new environment.

## Content workflow

1. Edit the site shell (brand, accessibility, components) in the configured site global, or page sections in the `pages` collection, in Payload Admin.
2. Preview changes through the Live Preview iframe — its URL is built per-document by `payload.config.ts`'s `livePreview.url`.
3. Publish when ready. A configured `WEBSITE_DEPLOY_WEBHOOK_URL` is called only for published `pages` documents.
4. Confirm the website is reading from `CMS_ORIGIN`.

The CMS is the sole authoring source; the website fetches from `CMS_ORIGIN` and has no fallback content snapshot.
