# PATCH Friday availability

Implemented and deployed in the existing Hugo/Cloudflare website. **Live team automation is enabled. Monday October 19's missed invitations for Friday October 23 were recovered as recorded below.** The production D1 binding is configured in `wrangler.toml`. Do not create a replacement database or rotate `LINK_SECRET`. The owner confirmed receiving the recovered invitation and explicitly authorized merging PR #1 into `main` on October 19. This authorization supersedes the older paused-testing and draft/unmerged instructions recorded below.

## Missed Monday invitations and recovery — October 19, 2026

- Root cause: the Saturday October 17 website-bio/contact deployment (`14a0d0c4-070f-4905-8259-a636ab0af3f5`, 11:06 AM Eastern) used the old assets-only `main` configuration. It replaced the shared `brianwinstonwebsite` Worker, removing the scheduler code, D1/assets bindings and all six secret bindings. The cron entry remained installed but had no scheduled handler to execute. `/api/patch/admin` and `/patch-meetings/` returned 404, no October 23 poll or invitation job existed, and no Monday live invitation had been attempted. This was not an inbox-delay diagnosis.
- Restored the verified original version `0aa8b30e-f2bb-49c9-8190-337728f630a0` to regain the original secrets and links. Rollback alone does not make a version the latest upload: an initial redeploy inherited the newer secretless upload. Recovered all six bindings without reading or changing their values using the Workers API's version-specific `inherit` bindings, then deployed the combined source as `1985f24c-b97e-44d9-8cb7-64ccabf09556`. The normal Wrangler deploy now succeeds with all six required-secret checks. Do not rotate LINK_SECRET to repair this failure.
- Recovered the missed batch under the normal `2026-10-23:invite` job and per-person delivery IDs. The one-time recovery used atomic D1 leases, the same provider idempotency keys and normal invitation content with the existing signed personal links. Resend accepted all five on their first attempt; provider receipts are stored in D1. No separate test batch or replacement participant credentials were created. A repeated production scheduler run retained the same five receipts without sending again. Provider acceptance is confirmed for all five; Brian subsequently confirmed inbox receipt. Other recipients' inbox receipt has not been independently confirmed.
- Added protected `POST /api/patch/admin/run` and `npm run patch:admin -- run` for direct scheduler recovery. It calls the ordinary scheduling function and respects live mode, durable pause, start time, stable weekly jobs and idempotency. Tests cover missing/participant credentials, disabled/paused/future-start suppression, the correct Friday and repeat-run behavior. All 22 tests and the Hugo build passed.
- Preserved Saturday's website changes in the deployment source: 5th year PhD candidate title/bio, the updated phone number and removal of the WashU year while retaining JHU years. The recovered live homepage's text matches the saved Saturday homepage exactly. The compact PATCH page, all five participant IDs/token versions, original Brian link, D1 history, production domain and cron remain intact. `private-study/` was not edited.
- Added `[secrets].required` so a normal deployment fails instead of silently publishing without the six secrets, plus repository deployment notes. The owner explicitly authorized merging PR #1 into `main` after confirming receipt of the recovered invitation. Deploy from an up-to-date `main` containing PR #1, or a branch based on it; deploying an older checkout can remove the scheduler again.

Recovery references: [Cloudflare binding inheritance](https://developers.cloudflare.com/api/resources/workers/) documents `version_id` inheritance through the Workers API; legacy script uploads inherit only from the latest upload, which may differ from the deployed rollback. The preserved version references and one-time recovery details are in ignored `.patch-*` files; never commit their contents.

## Live launch — October 16, 2026

- The owner explicitly approved live team mail and requested the first email on Monday for the following Friday. Configured `MAIL_MODE=live`, `MAIL_START_AT=2026-10-19T13:00:00Z` (Monday October 19, 9 AM EDT), and D1 `mail_paused=false`. No new environment, open browser or running Codex chat is required on Monday.
- Deployed version `0aa8b30e-f2bb-49c9-8190-337728f630a0`. Before resuming the durable switch, verified that production reports live mode, the exact start timestamp and `mailWaitingToStart=true`. Verified the five original participant IDs and token versions, all six secret names and the unchanged `*/15 * * * *` cron. No pending/uncertain delivery existed; the five old test receipts were already accepted.
- The future start applies to scheduled jobs, direct queue draining and link recovery, so enabling on Friday cannot catch up this Friday's invitations or reminders. Live delivery also skips any job for a Friday before the first authorized poll, including old completion notices. Once the start time passes, the existing Eastern-time Monday 9 AM and Wednesday 10 AM schedule continues each week. Cron may run shortly after the due time; delayed jobs catch up during that same scheduling week.
- After enabling, production reported `MAIL_MODE=live`, `mailPaused=false`, `mailWaitingToStart=true` and the exact Monday start. No non-test job was present and the original five test delivery receipts remained unchanged; no live email was sent during activation. The protected admin page displays the scheduled Monday 9 AM EDT start and the pause control remains available. Existing secrets, personal links, roster and `private-study/` were preserved. PR #1 was kept draft and unmerged at that time; the October 19 merge authorization above supersedes that restriction.
- All 21 tests passed, including simulated Friday/Sunday/Monday-before-start suppression, recovery and queued-completion suppression, exactly five first invitations for October 23 at the boundary, repeat-cron idempotency, Wednesday reminder timing, invalid-start failure and 9 AM Eastern behavior after the November DST change. Local browser checks and the Hugo build passed; the scheduled-start message was verified in the production admin page. Actual first-team-mail acceptance and inbox delivery can only be checked after Monday's scheduled run.

## Activation record — October 16, 2026

- Deployed the existing feature branch to `brianwinstonwebsite`, preserving its existing `brianwinston.com` custom-domain mapping and Hugo assets. Initial scheduler deployment version: `82d73bc6-a439-4c9a-ab2c-97bf4f524f8a`.
- Created production D1 `patch-meetings` (`d598e825-36ff-4e07-937a-4334ee9dcb3b`) and applied `0001_patch.sql`. Initialized exactly five active participants from the ignored 0600 roster input using D1 prepared parameters, after verifying the database was empty and paused. Names and stable IDs follow the roster below; emails remain outside Git.
- Configured all six secrets: `LINK_SECRET`, `ADMIN_TOKEN`, `RESEND_API_KEY`, `MAIL_FROM`, `ADMIN_EMAIL`, and `REPLY_TO`. No signing/admin secrets existed on the Worker before setup. Generated independent credentials; retain the signing secret for stable links. Private backup: ignored `.patch-activation-secrets.json` (0600, signing/admin credentials only). Move these credentials to a password manager. Brian's private link is in ignored `.patch-brian-link.txt` (0600).
- Verified deployed `MAIL_MODE=disabled`, D1 `mail_paused=true`, D1/assets bindings, all secret names, and the installed `*/15 * * * *` trigger through Cloudflare's API. Trigger installation alone does not establish successful cron execution.
- Inspected existing DNS records for the sending subdomain; changed none. The Resend key is send-only: domain-status and message-log reads are unavailable. The user reports the sending domain verified. A direct sender-verification message to Brian only was accepted by Resend; this does not verify inbox delivery or the deployed Worker queue. No other participant was emailed, and no production availability was entered.
- Independently checked Resend's [pricing](https://resend.com/pricing), [domain requirements](https://resend.com/docs/dashboard/domains/introduction), and [idempotency documentation](https://resend.com/docs/dashboard/emails/idempotency-keys). Published free transactional allowance: 3,000 emails/month and 100/day; this scheduler's expected volume fits. Overage billing is opt-in; no purchase, plan change, or paid upgrade was performed. The documented idempotency retention is 24 hours. Account-specific billing settings and usage were not available through the send-only key.
- Validation: all 14 backend tests, Hugo Extended 0.111.3 production build, and desktop/mobile Chromium smoke tests passed. Checked 36 generated discovery files; none contained PATCH URLs. Browser tests used isolated local D1 and synthetic identities, without real mail.
- The initial environment blocked `brianwinston.com`. Production access was subsequently verified as recorded below. Brian's authenticated save/edit flow and the five redirected invitation tests subsequently passed. Confirm receipt with Brian and inspect Resend delivery events before separately authorizing live team mail. PR #1 was kept draft and unmerged at that stage; see the later merge authorization above.

### Production verification resumed — October 16, 2026

- Verified the public page, admin login page, JavaScript and stylesheet on `https://brianwinston.com`; all five deployed assets match this branch byte for byte. The public API reports Friday October 16, America/New_York, the five expected participants, 40 slots and zero responses. Shared results contain neither email addresses nor personal credentials. Page/API responses carry the intended no-store, noindex and no-referrer headers; pages also carry the configured CSP.
- Chromium production checks passed at desktop and phone widths: public results load, all 40 intervals render, no participant editor appears without a personal link, historical Friday October 9 is read-only, and an invalid admin credential is rejected without showing protected results. No page JavaScript errors were observed. Browser requests used Playwright's verified HTTPS transport to trust the environment proxy CA; TLS verification remained enabled.
- API checks passed: missing/invalid admin credentials and an invalid personal credential return 401; an unauthenticated save returns 401; a cross-origin admin POST returns 403; future and non-Friday dates return 400; historical results return 200/read-only. No response was saved or modified.
- Scheduled poll creation is now observed: D1 contains Friday October 16 with `created_at=2026-10-16T14:30:39.513Z` (10:30:39 AM Eastern). The deployed scheduled handler creates this row even with mail disabled; no submission or test-mail operation was performed. The configured cron remains `*/15 * * * *`.
- Cloudflare/D1 reads reconfirmed all six secret names, existing D1/assets bindings, `MAIL_MODE=disabled`, `mail_paused=true`, exactly five active participants, zero responses, zero jobs and zero deliveries. Existing secrets, roster, DNS, production code and `private-study/` were not changed. No additional mail was sent.
- The owner supplied the existing admin credential in this chat. Authenticated production admin access passed, and Brian's existing link was retrieved without rotation. Production Chromium checks then passed drag selection/save, explicit all-day-unavailable save/reopen, editing back to selected availability and reopening, participant/admin separation (401), and historical-save rejection (409). Removed only the temporary Brian response with an exact timestamp/value guard, restoring zero responses. All existing secrets and personal links were retained.
- Ran exactly one deployed test job (`test:781e43da-0e23-4a67-8fc1-83c4438cc982`) at 10:41 AM Eastern. Temporarily deployed the existing Worker code with `MAIL_MODE=test`, inherited all other bindings/secrets and existing assets, confirmed test mode before resuming, then enqueued five invitations. Resend accepted all five on their first attempt; D1 retains all five provider receipts with `state=sent`, `attempts=1`, no errors and no pending deliveries. Test mode redirected all five to the previously configured Brian ADMIN_EMAIL. No other participant was emailed.
- Restored the durable pause and disabled mode immediately after testing. Final version: `f27130e5-4b8a-4905-b25b-07af85e112e7`. Verified `MAIL_MODE=disabled`, `mail_paused=true`, five active participants, zero responses and five accepted test deliveries. The deployed code/source map match the original deployment byte for byte; all six secret names, Brian's original personal link, the production custom domain and cron remain intact. No source change under `private-study/` occurred.
- Admin credentials are no longer a continuation blocker: the CLI reads the ignored private backup automatically and defaults its origin from `wrangler.toml`. The owner authorized replacing only the app's admin password if lost, using the already configured Cloudflare credentials. `npm run patch:admin -- reset-admin` implements that recovery without another environment or chat; see below. This command was tested with isolated fake provider operations; the existing production password was not reset.
- The owner confirmed receiving the test emails. Detailed date/Reply-To inspection and Resend delivery-event reads remain unconfirmed; the configured Resend key is send-only. Team mail remained disabled and paused and PR #1 draft/unmerged at that stage; the later live-mail and merge authorizations above supersede those restrictions.
- Removed the requested introductory heading, tagline and redundant Friday-availability label from the participant page. The Friday date is now its main heading; the scheduling controls and admin page retain their existing behavior. Published version `48d854e1-d277-47f2-95c0-9ccce58993e9` after a successful Hugo build. Production desktop/mobile checks confirmed all three phrases are absent, the date is the sole main heading, all 40 slots render, phone layout fits, historical results remain read-only, and invalid admin credentials remain rejected. Verified both mail stops and the original five accepted test deliveries again; no additional mail was sent.
- Replaced the long participant-page list with a compact When2meet-inspired layout: separate personal-selection and saved-team columns share an hourly axis covering all 40 intervals. The full day and submit button fit a single viewport at tested desktop and phone sizes; a compact team-status dropdown on phones avoids pushing the schedule down. Hover, tap or focus a team interval to see names. A dedicated participant stylesheet preserves the admin page. Published version `53f11ff8-2807-407d-962a-6f3e0ae4fb7b` after the Hugo build, all 18 tests and expanded local browser checks passed. Local checks covered eight viewport sizes down to 320×568, saved-only group counts, keyboard/drag/touch, failed-save retention, unavailable/edit/reopen, public link recovery, history and admin access. Read-only production browser checks verified personal/public views, the original Brian link, the mobile team dropdown and viewport fit. Verified all three changed live assets match source, all six secret names are present, both mail stops remain set and the poll remains at zero responses. No production response was changed or additional mail sent during this layout update.

## Architecture and behavior

`static/patch-meetings/` is a standalone website asset, copied by the existing Hugo build. It matches the site's personal/academic identity without loading theme analytics or search. It is not Hugo content, so it never enters navigation, home listings, search, sitemap or feeds. Both pages have noindex and no-referrer meta tags; the Worker adds no-store, noindex, CSP and no-referrer headers. The normal website still uses its existing assets binding and build/deploy scripts. The older Netlify configuration is unchanged; this feature's API/automation requires Cloudflare, not the old Netlify deployment.

The permanent address is `/patch-meetings/`; `/patch-meetings/admin/` requires an independent administrator bearer credential. Access to the general page is unlisted, **not private**. Anyone with its address can see names, saved slot availability and submitted comments. Participants cannot see email addresses or personal links in shared API results.

D1 stores participants, separate Friday polls, responses, durable jobs and per-recipient delivery states. A submitted empty response requires an explicit all-day-unavailable choice. Each response may include an optional plain-text comment of up to 500 characters, displayed under the participant's name in the shared team list and in admin status. Comments are saved atomically with availability, can be edited or cleared, and remain bound to that Friday. Existing responses show a blank comment. Apply the additive `0002_response_comments.sql` migration before deploying comment support; it preserves existing responses and remains compatible with the previous Worker's writes. There are 40 quarter-hour intervals from 8 AM to 6 PM Eastern, shown in compact personal and saved-team columns. Mouse dragging selects/clears ranges, keyboard Tab/Space toggles individual slots, arrow keys move focus between times, and mobile dragging is opt-in. Only saved responses affect the team column; unsaved personal selections stay separate. Hover, tap or focus a team interval for names. Group results refresh every 30 seconds without overwriting unsaved edits.

America/New_York date parts determine the current week and job eligibility. A fresh Friday starts Sunday at 6 AM, including DST transitions; Saturday and pre-rollover Sunday still show the previous Friday. A UTC cron runs every 15 minutes and checks Eastern wall time. Monday invitations become due at 9 AM, with Tuesday and Wednesday participant reminders at 10 AM. Both reminders target only people without a saved response for that Friday; all-day-unavailable counts as submitted. Each day has separate durable delivery IDs, and responses are checked again before sending. The admin missing-response summary remains Wednesday only. Cloudflare scheduling may be delayed; invitations and Wednesday reminders catch up during that same week. Tuesday reminders run only on Tuesday after 10 AM; they are not caught up on Wednesday, and queued Tuesday reminders are suppressed once Wednesday's reminder is due. No browser, laptop, commit or rebuild is needed for rollover. Explicit `?week=YYYY-MM-DD` links remain bound to that Friday; historical weeks are read-only and stale submissions return HTTP 409.

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

4. Keep `MAIL_MODE = "disabled"` for the initial deployment. The database also starts with `mail_paused=true`, an independent durable safety switch. Run `npm run build` and `npm run deploy` only when you intend to release the change. The production deployment and subsequent merge of PR #1 were explicitly authorized as recorded above. These disabled/paused defaults apply to new installations, not the existing live production scheduler.
5. Confirm `/patch-meetings/`, `/patch-meetings/admin/`, and `/api/patch/week` resolve on the same origin. Confirm the cron trigger is installed. The next cron creates the current poll even while mail is disabled/paused. Requests can also create a poll when submitting; historical responses are never recycled.

Use a **different D1 database, Worker name, secrets and origin** for any preview deployment. Never attach a preview to production D1. `wrangler deploy --dry-run` bundles without deploying or sending mail.

## Resend and DNS

Create a Resend account and add the sending domain/subdomain you control, preferably `updates.brianwinston.com`. In Resend's Domains screen choose its region and copy its exact DNS records into the authoritative DNS provider. These normally include DKIM TXT and SPF TXT/MX records for the sending/return-path subdomain; record names, values and priorities are supplied by Resend. Do not replace an existing root SPF record or mailbox MX records. Use DNS-only records where applicable. Add an appropriate DMARC TXT policy for the sending domain, initially monitoring if needed. Wait until Resend reports the domain verified, then create a sending API key scoped to that domain. No separate mailbox purchase is required to use a verified sender. Replies go to the independent REPLY_TO address.

The October 16, 2026 documentation check found a free transactional allowance of 3,000 emails/month and 100/day; see the activation record above. Recheck https://resend.com/pricing and https://resend.com/docs/dashboard/domains/introduction before enabling if continuing later, and confirm account-specific usage and billing settings in the dashboard. This workload is approximately 5 invitations + up to 10 reminders + 1 admin status + 1 completion per week (up to 17/week, about 85/month), plus link recovery and testing. Use a plan whose free allowance covers that, and do not enable automatic paid upgrades. Check Cloudflare Workers/D1 free allowances in your account too; do not purchase anything as part of setup.

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

The admin CLI automatically reads `ADMIN_TOKEN` from the ignored `.patch-activation-secrets.json` backup and defaults to the configured `PUBLIC_ORIGIN`. To override either value without putting credentials into shell history:

```sh
export PATCH_ORIGIN=https://brianwinston.com
read -r -s -p 'Admin credential: ' PATCH_ADMIN_TOKEN; echo
export PATCH_ADMIN_TOKEN
npm run patch:admin -- roster .patch-roster.json
npm run patch:admin -- status
npm run patch:admin -- link brian .patch-brian-link.txt
```

The link command writes a private, newly created 0600 file rather than printing the credential into logs. Deliver links privately or let Monday's invitations do so. Other participants can request recovery on the general page. Requests return the same generic result for known and unknown addresses, with limits of 6/IP/hour and 2/address/hour, and only mail active roster addresses. Recovery is disabled unless mail is live, unpaused and past its configured start time. Brian is both an ordinary participant and the sole intended administrator; his personal link does **not** authorize admin actions. Open `/patch-meetings/admin/` and paste ADMIN_TOKEN from your password manager.

```sh
# Revoke the old participant link and privately save its replacement:
npm run patch:admin -- rotate josh .patch-josh-reissued.txt
# Synchronize the ignored roster again after maintenance:
npm run patch:admin -- roster .patch-roster.json
```

If the admin password or local backup is lost, recover it with the existing `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` (and dependencies installed with `npm ci`):

```sh
npm run patch:admin -- reset-admin
npm run patch:admin -- status
```

The owner explicitly authorized this recovery when the admin password is unavailable. Future agents can run it using the existing Cloudflare credentials rather than ask the owner to recreate an environment, publish it, start another chat, or retrieve the old password. The command replaces **only** the deployed `ADMIN_TOKEN`, saves the new value in the ignored 0600 `.patch-activation-secrets.json`, and preserves any existing signing-secret backup. It never prints the password, changes `LINK_SECRET` or participant versions, replaces the roster, or enables mail. An existing `PATCH_ADMIN_TOKEN` override takes precedence over the backup; remove a stale override after reset. If the provider result is ambiguous, the command retains a separate private candidate file and stops; check that candidate before retrying.

In cloud environments running Node 24+, prefix admin status/link commands with `NODE_USE_ENV_PROXY=1` when required for the inherited HTTP proxy. This is a per-command setting, not an environment rebuild. Keep secret files/backups outside synced public folders. Do not commit `.patch-*`, `.dev.vars*`, `.env*`, `.wrangler/`, or provider keys.

## Test mail only to Brian, then enable automation

After deployment/roster initialization, change the committed environment setting to `MAIL_MODE = "test"` and redeploy. Test mode does not generate scheduled invitations/reminders; **every** queued email is redirected only to ADMIN_EMAIL and marked TEST. Set ADMIN_EMAIL to Brian's address before this step. Temporarily resume the durable switch and enqueue explicit test invitations:

```sh
npm run patch:admin -- resume
npm run patch:admin -- test-mail
npm run patch:admin -- status
npm run patch:admin -- pause
```

All five test messages go individually to Brian, allowing inspection of names, full Friday date, Eastern labels, Reply-To and personal links. These contain real team credentials: keep them private. Test jobs always remain redirected to ADMIN_EMAIL even if retried after switching to live mode. Confirm accepted messages in Resend and verify Brian actually received them. Test the page using Brian's personal link and test all-day-unavailable/edit behavior before enabling the team. Remove any temporary availability using a deliberate production edit; there is no automatic copying to future weeks.

For a scheduled launch, set `MAIL_MODE = "live"` and `MAIL_START_AT` to an explicit ISO timestamp with UTC offset, redeploy, verify the protected admin status, then `npm run patch:admin -- resume`. The current production launch is already configured and enabled as recorded above. All live sending and link recovery wait until that start, and jobs for earlier Fridays are skipped. An invalid timestamp fails closed. With no start timestamp, the next 15-minute cron catches up current-week jobs already due, so enabling midweek can immediately send invitations and reminders. After the configured start, weekly jobs continue at their Eastern wall times, including DST changes. Confirm the production roster has exactly the five intended members and inspect status/cron execution after activation; configuration alone does not prove that a future run succeeded.

Pause any time with `npm run patch:admin -- pause` or the protected admin button. This pauses all actual email sending, including recovery and pending completion notices; polls and responses continue. For a configuration-level stop, set MAIL_MODE disabled and redeploy. Pausing does not recall an in-flight provider request. Queued mail resumes later; old invitations/reminders are skipped after rollover, historical completion notices may still be sent. To prevent all execution, also remove/disable the Cloudflare cron trigger; the permanent page still determines the correct current week dynamically.

## Reliability and troubleshooting

```sh
npm run patch:admin -- status                 # current responses and delivery states
npm run patch:admin -- status 2026-10-16      # historical Friday
npm run patch:admin -- run                   # authorized catch-up, same weekly job IDs
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

See the activation and incident records for the latest pass/fail results. All 25 tests passed, including credential recovery, scheduled-launch, protected manual-recovery, Tuesday/Wednesday reminder targeting and comment persistence/validation checks. Local browser smoke checks cover desktop drag, keyboard selection, save failures retaining selections, successful saves, all-day edits/reopen, phone touch mode, mobile width and admin access. Generated sitemap, RSS and search output should also be checked after building; no PATCH URL should appear. Public and authenticated production browser/API checks, scheduled poll creation, Brian's save/edit/unavailable flow and the five redirected test acceptances are recorded above. The owner confirmed receiving the earlier test emails. The recovered live October 23 invitation batch has five accepted provider receipts; provider delivery events remain unavailable to the send-only key.
