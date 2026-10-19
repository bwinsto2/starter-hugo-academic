# Production website and PATCH scheduler

`brianwinstonwebsite` serves both brianwinston.com and the live PATCH scheduler.
An assets-only deployment removes the scheduler API, D1 binding and mail secrets.
This happened on October 17, 2026 and prevented the first Monday invitations.

- Read `docs/patch-meetings.md` before deploying any website change, including bio
  and contact edits. Preserve `worker/index.mjs`, the ASSETS and DB bindings,
  PATCH routing, cron, mail settings and all six required secrets in
  `wrangler.toml`.
- Until PR #1 is merged, production scheduler code is on
  `feature/patch-meetings`; the older `main` checkout cannot safely deploy this
  Worker. Do not deploy an old checkout or use `wrangler deploy --assets`.
- After a deployment, verify `/api/patch/week` returns the current Friday and
  roster, authenticated admin status works, all six secret names remain present,
  and `*/15 * * * *` remains installed. A successful asset upload alone does not
  establish a successful scheduler deployment.
- Preserve stable participant IDs, token versions and LINK_SECRET. Never print or
  commit roster emails, personal links, credentials or `.patch-*` files.
- Rollback restores a deployed version but does not make it the latest uploaded
  version. Secret inheritance uses the latest upload. If that upload lost its
  secrets, recover bindings from the known good version with the Workers API's
  version-specific `inherit` bindings; do not rotate LINK_SECRET or assume a new
  deploy will inherit from the active rollback.
- Use `npm run patch:admin -- run` for an authorized manual scheduler catch-up.
  It respects mail mode, pause and start time, and shares the scheduled job IDs,
  leases and provider idempotency keys. Verify recorded receipts before retrying
  uncertain deliveries. Do not send a new test job to recover missing live mail.
- Leave `private-study/` untouched unless the user explicitly requests work there.
