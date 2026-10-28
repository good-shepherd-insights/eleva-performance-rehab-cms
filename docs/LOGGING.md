# Debug logging

Guidance for temporary diagnostic logging added while chasing a specific bug — not a general application-logging framework.

## Ground rules

1. **State what it's for and when to remove it, in the code itself.** A comment like "diagnostic-only, remove once X is understood" is not self-enforcing — nothing in the codebase actually deletes the logger once the bug is fixed. Prefer an explicit kill switch (below) over a comment that trusts someone to remember.
2. **Gate it behind an env var, never ship it unconditionally.** If it runs in every environment regardless of a flag, it runs in production too.
3. **Never log secrets, even truncated ones you think are safe.** A "safe" partial value is still a partial value — an attacker doesn't need the whole token if the logging surface narrows the search space.
4. **Log through the app's structured logger, not `console.log`.** Ad hoc `console.log` calls can't be filtered, leveled, shipped to an aggregator, or turned off centrally.
5. **One shared implementation, not a client copy and a server copy.** Duplicated logging logic drifts — one side gets fixed or removed, the other doesn't.
6. **Don't log full request/response bodies.** Log the fields that answer the question you're actually debugging; a full body dump becomes uncontrolled surface for whatever sensitive fields happen to pass through.

## Worked example: what needs work

This project briefly carried a real diagnostic logger for a session-drop bug — `src/admin/AuthDebugLogger.tsx` (client, fetch-wrapping) paired with `src/middleware.ts` (server, cookie-header logging). The core idea was reasonable: log every auth-relevant request/response on both sides of a suspected cookie-auth bug, since the two failure modes (JS fetch vs. hard navigation/RSC request) are invisible to each other. That half — deciding *what* to observe — was a decent instinct.

What the implementation got wrong, concretely:

- **No env gate.** Both files ran in every environment the code shipped to, with no `if (process.env.DEBUG_AUTH)` or equivalent. Nothing stopped this from running in production by accident.
- **Raw `console.log`, not the app logger.** Payload/Next already expose a structured logger (`req.payload.logger` server-side). Bypassing it means these logs can't be filtered or turned off without an editing a file and redeploying.
- **Regex-matched URLs, fragile by construction.** `/\/api\/users\/(me|login|first-register|logout)|\/admin\b/` silently stops matching the moment a route is renamed, and silently *starts* matching things it shouldn't as routes are added. A route-based allowlist maintained next to the actual route definitions would drift less.
- **Logged more than the question needed.** `bodySnippet: body` dumped the full parsed response body on every auth-relevant call. The actual question ("is the cookie present, does the browser send it") only needed `payloadTokenPresent`/`hasCookieHeader` — which the code *also* logged, correctly, alongside the unnecessary full body.
- **No enforced removal.** The comment said "remove once the session-drop issue is understood." Nothing made that true — it shipped as an uncommitted, unreviewed change sitting in the working tree indefinitely, wired into `payload.config.ts`'s `admin.components.providers`, until it was manually found and deleted in a later session.
- **Split across two files with no shared contract.** The client and server halves independently decided what "auth-relevant" meant, with separate regexes that could (and did) diverge.

A version of this same diagnostic that followed the ground rules above — env-flagged, through the structured logger, logging only the presence/absence facts rather than full bodies, with an explicit removal step tied to the bug's resolution — would have been a genuinely useful temporary tool instead of dead weight that had to be found and cleaned up later.
