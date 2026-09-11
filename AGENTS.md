<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Company Policy

Read and follow [COMPANY_POLICY.md](COMPANY_POLICY.md) before using this
repository context or making changes. Company policy is mandatory and
violations are blocking issues.

## Development

```bash
pnpm install
pnpm dev                 # Payload admin + API at CMS_ORIGIN/admin
pnpm generate:types       # after any collection/global field change
pnpm generate:importmap   # after adding/removing an admin component
pnpm migrate
```

## Documentation

- [`CONTEXT.md`](CONTEXT.md) — repository context and system design.
- [Payload documentation](https://payloadcms.com/docs) — CMS framework reference.
- Next.js guide: `node_modules/next/dist/docs/` (see block above).
