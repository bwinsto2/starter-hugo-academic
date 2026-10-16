# PATCH Friday availability

Implemented and deployed in the existing Hugo/Cloudflare website. **Team automation remains disabled and paused.** The production D1 binding is configured in `wrangler.toml`. Do not create a replacement database or rotate `LINK_SECRET` when continuing activation.

## Activation record — October 16, 2026

- Deployed the existing feature branch to `brianwinstonwebsite`, preserving its existing `brianwinston.com` custom-domain mapping and Hugo assets. Initial scheduler deployment version: `82d73bc6-a439-4c9a-ab2c-97bf4f524f8a`.
- Created production D1 `patch-meetings` (`d598e825-36ff-4e07-937a-4334ee9dcb3b`) and applied `0001_patch.sql`. Initialized exactly five active participants from the ignored 0600 roster input using D1 prepared parameters, after verifying the database was empty and paused. Names and stable IDs follow the roster below; emails remain outside Git.
- Configured all six secrets: `LINK_SECRET`, `ADMIN_TOKEN`, `RESEND_API_KEY`, `MAIL_FROM`, `ADMIN_EMAIL`, and `REPLY_TO`. No signing/admin secrets existed on the Worker before setup. Generated independent credentials; retain the signing secret for stable links. Private backup: ignored `.patch-activation-secrets.json` (0600, signing/admin credentials only). Move these credentials to a password manager. Brian's private link is in ignored `.patch-brian-link.txt` (0600).
- Verified deployed `MAIL_MODE=disabled`, D1 `mail_paused=true`, D1/assets bindings, all secret names, and the installed `*/15 * * * *` trigger through Cloudflare's API. Trigger installation alone does not establish successful cron execution.
- Inspected existing DNS records for the sending subdomain; changed none. The Resend key is send-only: domain-status and message-log reads are unavailable. The user reports the sending domain verified. A direct sender-verification message to Brian only was accepted by Resend; this does not verify inbox delivery or the deployed Worker queue. No other participant was emailed, and no production availability was entered.
- Independently checked Resend's [pricing](https://resend.com/pricing), [domain requirements](https://resend.com/docs/dashboard/domains/introduction), and [idempotency documentation](https://resend.com/docs/dashboard/emails/idempotency-keys). Published free transactional allowance: 3,000 emails/month and 100/day; this scheduler's expected volume fits. Overage billing is opt-in; no purchase, plan change, or paid upgrade was performed. The documented idempotency retention is 24 hours. Account-specific billing settings and usage were not available through the send-only key.
- Validation: all 14 backend tests, Hugo Extended 0.111.3 production build, and desktop/mobile Chromium smoke tests passed. Checked 36 generated discovery files; none contained PATCH URLs. Browser tests used isolated local D1 and synthetic identities, without real mail.
- Remaining activation checks: the execution environment's proxy currently blocks `brianwinston.com` with HTTP 403. Add that hostname to the environment's allowed hosts, then verify production page/API/admin access and Brian's save/edit flow. Run the five redirected invitation tests using the procedure below; restore both mail stops afterward. Confirm receipt with Brian and inspect Resend delivery events before separately authorizing live team mail. Keep PR #1 draft and unmerged.

## Architecture and behavior

`static/patch-meetings/` is a standalone website asset, copied by the existing Hugo build. It matches the site's personal/academic identity without loading theme analytics or search. It is not Hugo content, so it never enters navigation, home listings, search, sitemap or feeds. Both pages have noindex and no-referrer meta tags; the Worker adds no-store, noindex, CSP and no-referrer headers. The normal website still uses its existing assets binding and build/deploy scripts. The older Netlify configuration is unchanged; this feature's API/automation requires Cloudflare, not the old Netlify deployment.

The permanent address is `/patch-meetings/`; `/patch-meetings/admin/` requires an independent administrator bearer credential. Access to the general page is unlisted, **not private**. Anyone with its address can see names and saved slot availability. Participants cannot see email addresses or personal links in shared API results.

D1 stores participants, separate Friday polls, responses, durable jobs and per-recipient delivery states. A submitted empty response requires an explicit all-day-unavailable choice. There are 40 quarter-hour intervals from 8 AM to 6 PM Eastern. Mouse dragging selects/clears ranges, keyboard Tab/Space toggles individual slots, and mobile dragging is opt-in so ordinary scrolling works. Only saved responses affect counts. Group results refresh every 30 seconds without overwriting unsaved edits.

America/New_York date parts determine the current week and job eligibility. A fresh Friday starts Sunday at 6 AM, including DST transitions; Saturday and pre-rollover Sunday still show the previous Friday. A UTC cron runs every 15 minutes and checks Eastern wall time. Monday invitations become due at 9 AM, Wednesday reminders at 10 AM. Cloudflare scheduling may be delayed; jobs catch up during that same week. No browser, laptop, commit or rebuild is needed for rollover. Explicit `?week=YYYY-MM-DD` links remain bound to that Friday; historical weeks are read-only and stale submissions return HTTP 409.

Personal credentials are HMAC-SHA256 signatures over stable participant ID + token version. Keep LINK_SECRET unchanged to retain links across weeks. Revoking one person increments their version. Changing their email or reactivating an inactive ID also revokes the former link. Changing LINK_SECRET revokes everyone's links. The link token lives after `#token=`, is removed from browser history on load, and is used only in Authorization headers. It is kept in tab memory, never localStorage. Reloading a cleaned URL requires reopening the original invitation. There is no third-party analytics code on these pages. Avoid logging Authorization headers, emails, request bodies, or full email payloads in Cloudflare/Resend integrations. Shared devices should close the tab after use.

## Local checks

Use Node 22+ and a real Go toolchain in PATH (Hugo modules require Go; `/usr/bin/go` in the development container was an unrelated program). The existing build script downloads Hugo Extended 0.111.3 if absent.

```sh
npm ci
npm test
npm run build
npx wrangler deploy --dry-run --outdir work/worker-build
```

The tests use real local D1 via Miniflare, synthetic `.invalid` emails, and a mocked Resend fetch. They never call the real provider. Optional browser smoke test, when Playwright and Chromium are installed:

```sh
node tests/browser.mjs
```

For an interactive local server, create ignored `.dev.vars` with **local-only** credentials:

```dotenv
LINK_SECRET="<random 32+ byte local secret>"
ADMIN_TOKEN="<different random 32+ byte local secret>"
MAIL_MODE="disabled"
```

```sh
npx wrangler d1 migrations apply patch-meetings --local
npm run patch:dev
```

In another shell set `PATCH_ORIGIN=http://localhost:8787` and `PATCH_ADMIN_TOKEN` to the local admin value, then initialize the synthetic or real roster using the command below. Local state is ignored under `.wrangler/`. Never copy production tokens into test fixtures.

## Cloudflare activation

1. Authenticate in your own shell with `npx wrangler login` (or a suitably scoped Cloudflare API token). Confirm the selected account and existing `brianwinstonwebsite` Worker/custom domain. Preserve its existing domain mapping; no new website or framework is needed.
2. For a fresh installation, create D1 (the production database above already exists; reuse it):

   ```sh
   npx wrangler d1 create patch-meetings
   ```

   Replace only `database_id` in the existing `[[d1_databases]]` block with the returned real UUID. Keep the binding name `DB` and migrations directory. Commit the real database UUID if desired: it is an identifier, not a credential.

3. Apply the schema and configure secrets:

   ```sh
   npx wrangler d1 migrations apply patch-meetings --remote
   npx wrangler secret put LINK_SECRET
   npx wrangler secret put ADMIN_TOKEN
   npx wrangler secret put RESEND_API_KEY
   npx wrangler secret put MAIL_FROM
   npx wrangler secret put ADMIN_EMAIL
   npx wrangler secret put REPLY_TO
   ```

   Generate LINK_SECRET and ADMIN_TOKEN **independently**, for example with `openssl rand -hex 32`, and store each in a password manager. Paste secret values at Wrangler's prompts, not into Git or command-line arguments. MAIL_FROM should be a verified sender such as `PATCH <patch@updates.YOUR_DOMAIN>`. Set ADMIN_EMAIL and REPLY_TO to Brian's address supplied in the task. No real address is stored in committed configuration or frontend code.

4. Keep `MAIL_MODE = "disabled"` for the initial deployment. The database also starts with `mail_paused=true`, an independent durable safety switch. Run `npm run build` and `npm run deploy` only when you intend to release the change. The production deployment recorded above was explicitly authorized; PR #1 remains draft and must not be merged automatically.
5. Confirm `/patch-meetings/`, `/patch-meetings/admin/`, and `/api/patch/week` resolve on the same origin. Confirm the cron trigger is installed. The next cron creates the current poll even while mail is disabled/paused. Requests can also create a poll when submitting; historical responses are never recycled.

Use a **different D1 database, Worker name, secrets and origin** for any preview deployment. Never attach a preview to production D1. `wrangler deploy --dry-run` bundles without deploying or sending mail.

## Resend and DNS

Create a Resend account and add the sending domain/subdomain you control, preferably `updates.brianwinston.com`. In Resend's Domains screen choose its region and copy its exact DNS records into the authoritative DNS provider. These normally include DKIM TXT and SPF TXT/MX records for the sending/return-path subdomain; record names, values and priorities are supplied by Resend. Do not replace an existing root SPF record or mailbox MX records. Use DNS-only records where applicable. Add an appropriate DMARC TXT policy for the sending domain, initially monitoring if needed. Wait until Resend reports the domain verified, then create a sending API key scoped to that domain. No separate mailbox purchase is required to use a verified sender. Replies go to the independent REPLY_TO address.

The October 16, 2026 documentation check found a free transactional allowance of 3,000 emails/month and 100/day; see the activation record above. Recheck https://resend.com/pricing and https://resend.com/docs/dashboard/domains/introduction before enabling if continuing later, and confirm account-specific usage and billing settings in the dashboard. This workload is approximately 5 invitations + up to 5 reminders + 1 admin status + 1 completion per week (up to 12/week, about 60/month), plus link recovery and testing. Use a plan whose free allowance covers that, and do not enable automatic paid upgrades. Check Cloudflare Workers/D1 free allowances in your account too; do not purchase anything as part of setup.

## Secure roster setup and personal links

Create an **ignored** `.patch-roster.json` with permissions 0600. An ignored file with the supplied production roster was prepared locally for convenience; it is never staged. To recreate it, use this shape and fill each email privately from the task:

```json
[
  { "id": "brian", "name": "Brian Winston", "email": "<Brian's email>" },
  {
    "id": "josh",
    "name": "Josh \"Handsome\" Bloch",
    "email": "<Josh's email>"
  },
  { "id": "fred", "name": "Fred Barrett", "email": "<Fred's email>" },
  { "id": "bo", "name": "Bo Wang", "email": "<Bo's email>" },
  { "id": "nate", "name": "Nate Heller", "email": "<Nate's email>" }
]
```

Keep IDs stable on later edits. The protected roster endpoint requires exactly five unique IDs and emails. Roster synchronization updates names/emails and deactivates absent IDs without deleting historical response rows. Historical display labels and expected counts currently use the active roster; roster membership changes can change historical displays. Back up/export D1 before roster changes if a fixed historical roster snapshot is required.

Set administrative environment variables without putting credentials into shell history:

```sh
export PATCH_ORIGIN=https://brianwinston.com
read -r -s -p 'Admin credential: ' PATCH_ADMIN_TOKEN; echo
export PATCH_ADMIN_TOKEN
npm run patch:admin -- roster .patch-roster.json
npm run patch:admin -- status
npm run patch:admin -- link brian .patch-brian-link.txt
```

The link command writes a private, newly created 0600 file rather than printing the credential into logs. Deliver links privately or let Monday's invitations do so. Other participants can request recovery on the general page. Requests return the same generic result for known and unknown addresses, with limits of 6/IP/hour and 2/address/hour, and only mail active roster addresses. Recovery is disabled unless mail is live and unpaused. Brian is both an ordinary participant and the sole intended administrator; his personal link does **not** authorize admin actions. Open `/patch-meetings/admin/` and paste ADMIN_TOKEN from your password manager.

```sh
# Revoke the old participant link and privately save its replacement:
npm run patch:admin -- rotate josh .patch-josh-reissued.txt
# Synchronize the ignored roster again after maintenance:
npm run patch:admin -- roster .patch-roster.json
```

If ADMIN_TOKEN is lost, set a new independent value with `wrangler secret put ADMIN_TOKEN`; this does not revoke participant links. Keep secret files/backups outside synced public folders. Do not commit `.patch-*`, `.dev.vars*`, `.env*`, `.wrangler/`, or provider keys.

## Test mail only to Brian, then enable automation

After deployment/roster initialization, change the committed environment setting to `MAIL_MODE = "test"` and redeploy. Test mode does not generate scheduled invitations/reminders; **every** queued email is redirected only to ADMIN_EMAIL and marked TEST. Set ADMIN_EMAIL to Brian's address before this step. Temporarily resume the durable switch and enqueue explicit test invitations:

```sh
npm run patch:admin -- resume
npm run patch:admin -- test-mail
npm run patch:admin -- status
npm run patch:admin -- pause
```

All five test messages go individually to Brian, allowing inspection of names, full Friday date, Eastern labels, Reply-To and personal links. These contain real team credentials: keep them private. Test jobs always remain redirected to ADMIN_EMAIL even if retried after switching to live mode. Confirm accepted messages in Resend and verify Brian actually received them. Test the page using Brian's personal link and test all-day-unavailable/edit behavior before enabling the team. Remove any temporary availability using a deliberate production edit; there is no automatic copying to future weeks.

When ready, set `MAIL_MODE = "live"`, redeploy, then `npm run patch:admin -- resume`. The next 15-minute cron catches up any current-week jobs already due; enabling midweek can immediately send invitations and outstanding reminders. Confirm the production roster has exactly the five intended members. Check status and Cloudflare cron execution after activation. The page/admin do not infer that a cron is healthy merely from configuration.

Pause any time with `npm run patch:admin -- pause` or the protected admin button. This pauses all actual email sending, including recovery and pending completion notices; polls and responses continue. For a configuration-level stop, set MAIL_MODE disabled and redeploy. Pausing does not recall an in-flight provider request. Queued mail resumes later; old invitations/reminders are skipped after rollover, historical completion notices may still be sent. To prevent all execution, also remove/disable the Cloudflare cron trigger; the permanent page still determines the correct current week dynamically.

## Reliability and troubleshooting

```sh
npm run patch:admin -- status                 # current responses and delivery states
npm run patch:admin -- status 2026-10-16      # historical Friday
npx wrangler tail                            # no tokens or email bodies are logged by this code
npm run patch:admin -- retry '<delivery-id>'  # failed delivery, preserves logical idempotency key
```

Jobs and deliveries use unique IDs. Completion is inserted conditionally in a D1 transaction when all active participants have saved; concurrent final submissions create only one completion delivery, including late submissions after Wednesday. A lease claims each delivery atomically, and the same Resend idempotency key is used after errors or expired leases. Successes are not resent by routine cron retries. Reminders check the actual saved response again immediately before the provider call. A submission arriving after that check can still cross an already-in-flight reminder.

Transient errors back off; after 8 attempts a delivery becomes `failed`. Delivery states/errors/attempts are visible to admin; missing configuration causes cron failure visible in Cloudflare logs. After 23 hours from the first attempt, uncertain deliveries go to `review`, because provider idempotency protection is time-limited. Check Resend for the delivery/idempotency key before retrying. Only if it was not accepted:

```sh
PATCH_CONFIRM_NOT_DELIVERED=yes npm run patch:admin -- retry '<review-delivery-id>'
```

If Resend accepted it, leave it in review rather than resend. This avoids claiming impossible exactly-once delivery after an ambiguous provider result. The 24-hour provider idempotency window used by this implementation should also be checked against current Resend API docs before activation. Normal retries occur well within it.

`sent` means **provider accepted**, not delivered to inbox. Inspect the Resend dashboard for bounces, suppression, complaints and failed delivery events, correct the roster as needed, then use the documented retry path. No inbound webhook is implemented. There is no automatic meeting selection, calendar integration or calendar invitation.

## Verification recorded for this implementation

See the activation record and final task report for the latest pass/fail results. The included tests cover rollover/DST, interval validation, personal/admin isolation, missing vs unavailable, edits and history, concurrent completion, invites, targeted reminders and late completion, pause/test mode, rate limits, retries and provider failures. Browser smoke checks cover desktop drag, keyboard selection, save failures retaining selections, successful saves, all-day edits/reopen, phone touch mode, mobile width and admin access. Generated sitemap, RSS and search output should also be checked after building; no PATCH URL should appear. Production end-to-end checks, inbox delivery, and successful cron execution remain to be confirmed as described in the activation record.
