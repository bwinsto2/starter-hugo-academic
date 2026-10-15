import {
  currentFriday,
  validFriday,
  fullDate,
  validateResponse,
  heatmap,
  dueJobs,
} from "./domain.mjs";
const encoder = new TextEncoder();
const iso = () => new Date().toISOString();
const q = (env, sql, ...args) => env.DB.prepare(sql).bind(...args);
const rows = async (stmt) => (await stmt.all()).results;
const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
      "X-Robots-Tag": "noindex, nofollow",
      "Referrer-Policy": "no-referrer",
    },
  });
class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}
async function signature(env, value) {
  if (!env.LINK_SECRET || env.LINK_SECRET.length < 32)
    throw new HttpError(503, "Personal links are not configured.");
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(env.LINK_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return Array.from(
    new Uint8Array(
      await crypto.subtle.sign("HMAC", key, encoder.encode(value)),
    ),
    (b) => b.toString(16).padStart(2, "0"),
  ).join("");
}
function equal(a, b) {
  if (typeof a !== "string" || typeof b !== "string") return false;
  let diff = a.length ^ b.length;
  for (let i = 0; i < Math.max(a.length, b.length); i++)
    diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  return diff === 0;
}
export async function personalToken(env, p) {
  const base = `${p.id}.${p.token_version}`;
  return `${base}.${await signature(env, base)}`;
}
async function participant(req, env) {
  const token = (req.headers.get("Authorization") || "").replace(
    /^Bearer /,
    "",
  );
  if (!/^[a-z0-9_-]+\.\d+\.[a-f0-9]{64}$/.test(token))
    throw new HttpError(401, "Open your personal link to submit.");
  const [id, version] = token.split(".");
  const p = await q(
    env,
    "SELECT * FROM participants WHERE id=? AND active=1",
    id,
  ).first();
  if (
    !p ||
    String(p.token_version) !== version ||
    !equal(token, await personalToken(env, p))
  )
    throw new HttpError(
      401,
      "This personal link is invalid or has been revoked. Request a new link.",
    );
  return p;
}
function admin(req, env) {
  if (
    !env.ADMIN_TOKEN ||
    env.ADMIN_TOKEN.length < 32 ||
    !equal(req.headers.get("Authorization"), `Bearer ${env.ADMIN_TOKEN}`)
  )
    throw new HttpError(401, "Administrator authorization required.");
}
async function body(req) {
  if (+(req.headers.get("content-length") || 0) > 8192)
    throw new HttpError(413, "Request too large.");
  const text = await req.text();
  if (text.length > 8192) throw new HttpError(413, "Request too large.");
  try {
    const value = JSON.parse(text);
    if (!value || typeof value !== "object" || Array.isArray(value))
      throw new Error("Invalid object");
    return value;
  } catch {
    throw new HttpError(400, "Invalid JSON.");
  }
}
async function rate(env, key, max, seconds) {
  const now = Math.floor(Date.now() / 1000);
  const row = await q(
    env,
    `INSERT INTO rate_limits(key,hits,expires) VALUES (?,1,?) ON CONFLICT(key) DO UPDATE SET hits=CASE WHEN expires<=? THEN 1 ELSE hits+1 END, expires=CASE WHEN expires<=? THEN excluded.expires ELSE expires END RETURNING hits`,
    key,
    now + seconds,
    now,
    now,
  ).first();
  if (row.hits > max)
    throw new HttpError(429, "Please wait before trying again.");
}
async function ensureWeek(env, friday) {
  await q(env, "INSERT OR IGNORE INTO weeks VALUES (?,?)", friday, iso()).run();
}
async function snapshot(env, friday, who = null, isAdmin = false) {
  const people = await rows(
    q(env, "SELECT id,name FROM participants WHERE active=1 ORDER BY id"),
  );
  const responses = await rows(
    q(
      env,
      "SELECT r.* FROM responses r JOIN participants p ON p.id=r.participant_id WHERE r.friday=? AND p.active=1",
      friday,
    ),
  );
  const current = currentFriday();
  return {
    friday,
    currentFriday: current,
    readOnly: friday !== current,
    timezone: "America/New_York",
    expected: people.length,
    submitted: responses.length,
    people: people.map((p) => {
      const r = responses.find((r) => r.participant_id === p.id);
      return {
        ...p,
        submitted: !!r,
        unavailable: !!r?.unavailable,
        updatedAt: r?.updated_at || null,
      };
    }),
    slots: heatmap(people, responses),
    me: who
      ? {
          id: who.id,
          name: who.name,
          response:
            responses
              .filter((r) => r.participant_id === who.id)
              .map((r) => ({
                slots: JSON.parse(r.slots),
                unavailable: !!r.unavailable,
                updatedAt: r.updated_at,
              }))[0] || null,
        }
      : null,
    ...(isAdmin
      ? {
          deliveries: await rows(
            q(
              env,
              "SELECT d.*,j.friday FROM deliveries d JOIN jobs j ON j.id=d.job_id WHERE j.friday=? ORDER BY d.id",
              friday,
            ),
          ),
          mailPaused: await paused(env),
          mailMode: env.MAIL_MODE || "disabled",
        }
      : {}),
  };
}
function weekParam(url) {
  const friday = url.searchParams.get("week") || currentFriday();
  if (!validFriday(friday) || friday > currentFriday())
    throw new HttpError(400, "Choose a current or historical Friday.");
  return friday;
}
async function paused(env) {
  return (
    (await q(env, "SELECT value FROM settings WHERE key='mail_paused'").first())
      ?.value !== "false"
  );
}
function jobStatements(env, id, friday, kind, recipients) {
  const now = iso();
  return [
    q(
      env,
      "INSERT OR IGNORE INTO jobs VALUES (?,?,?,?)",
      id,
      friday,
      kind,
      now,
    ),
    ...recipients.map((p) =>
      q(
        env,
        "INSERT OR IGNORE INTO deliveries(id,job_id,participant_id,kind,next_at) VALUES (?,?,?,?,?)",
        `${id}:${p || "admin"}`,
        id,
        p,
        kind,
        now,
      ),
    ),
  ];
}
export async function queueCompletion(env, friday) {
  const id = `${friday}:complete`,
    now = iso();
  await env.DB.batch([
    q(
      env,
      `INSERT OR IGNORE INTO jobs SELECT ?,?,'complete',? WHERE (SELECT count(*) FROM participants WHERE active=1)>0 AND NOT EXISTS(SELECT 1 FROM participants p WHERE active=1 AND NOT EXISTS(SELECT 1 FROM responses r WHERE r.friday=? AND r.participant_id=p.id))`,
      id,
      friday,
      now,
      friday,
    ),
    q(
      env,
      `INSERT OR IGNORE INTO deliveries(id,job_id,participant_id,kind,next_at) SELECT ?,id,NULL,'complete',? FROM jobs WHERE id=?`,
      `${id}:admin`,
      now,
      id,
    ),
  ]);
}
export async function schedule(env, now = new Date()) {
  const friday = currentFriday(now);
  await ensureWeek(env, friday);
  if (env.MAIL_MODE !== "live" || (await paused(env))) return;
  const due = dueJobs(now),
    people = await rows(q(env, "SELECT id FROM participants WHERE active=1"));
  if (due.invitations)
    await env.DB.batch(
      jobStatements(
        env,
        `${friday}:invite`,
        friday,
        "invite",
        people.map((p) => p.id),
      ),
    );
  if (due.reminders) {
    const missing = await rows(
      q(
        env,
        "SELECT id FROM participants p WHERE active=1 AND NOT EXISTS(SELECT 1 FROM responses r WHERE r.friday=? AND r.participant_id=p.id)",
        friday,
      ),
    );
    // Create one reminder job per week even if nobody is missing.
    await env.DB.batch(
      jobStatements(env, `${friday}:remind`, friday, "remind", []),
    );
    // Only enqueue once: a transaction records its recipient snapshot with the marker.
    const marker = `${friday}:reminder-snapshot`;
    const statements = [
      q(
        env,
        "INSERT OR IGNORE INTO jobs VALUES (?,?,?,?)",
        marker,
        friday,
        "snapshot",
        iso(),
      ),
    ];
    // WHERE NOT EXISTS uses a delivery marker, inserted last, to make this atomic across cron retries.
    for (const p of [
      ...missing.map((p) => p.id),
      ...(missing.length ? [null] : []),
    ])
      statements.push(
        q(
          env,
          `INSERT OR IGNORE INTO deliveries(id,job_id,participant_id,kind,next_at) SELECT ?,?,?,?,? WHERE NOT EXISTS(SELECT 1 FROM deliveries WHERE id=?)`,
          `${friday}:remind:${p || "admin"}`,
          `${friday}:remind`,
          p,
          p ? "remind" : "status",
          iso(),
          marker,
        ),
      );
    statements.push(
      q(
        env,
        `INSERT OR IGNORE INTO deliveries(id,job_id,kind,state,next_at) VALUES (?,?,'marker','skipped',?)`,
        marker,
        marker,
        iso(),
      ),
    );
    await env.DB.batch(statements);
  }
  await queueCompletion(env, friday);
  await drain(env);
  await q(
    env,
    "DELETE FROM rate_limits WHERE expires<?",
    Math.floor(Date.now() / 1000) - 86400,
  ).run();
}
function escape(s) {
  return s.replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
}
async function mailContent(env, d) {
  const job = await q(env, "SELECT * FROM jobs WHERE id=?", d.job_id).first();
  const p = d.participant_id
    ? await q(
        env,
        "SELECT * FROM participants WHERE id=? AND active=1",
        d.participant_id,
      ).first()
    : null;
  if (d.participant_id && !p) return null;
  if (d.kind === "invite" && job.friday !== currentFriday()) return null;
  if (["remind", "status"].includes(d.kind)) {
    if (job.friday !== currentFriday()) return null;
    if (
      p &&
      (await q(
        env,
        "SELECT 1 FROM responses WHERE friday=? AND participant_id=?",
        job.friday,
        p.id,
      ).first())
    )
      return null;
  }
  const base = env.PUBLIC_ORIGIN || "https://brianwinston.com",
    date = fullDate(job.friday);
  const link = p
    ? `${base}/patch-meetings/?week=${job.friday}#token=${await personalToken(env, p)}`
    : `${base}/patch-meetings/admin/?week=${job.friday}`;
  let subject = `PATCH availability: ${date}`,
    text;
  if (d.kind === "status") {
    const missing = await rows(
      q(
        env,
        "SELECT name FROM participants p WHERE active=1 AND NOT EXISTS(SELECT 1 FROM responses r WHERE r.friday=? AND r.participant_id=p.id)",
        job.friday,
      ),
    );
    if (!missing.length) return null;
    const total = (
      await q(
        env,
        "SELECT count(*) AS n FROM participants WHERE active=1",
      ).first()
    ).n;
    text = `${total - missing.length} of ${total} responses received for ${date}. Still missing: ${missing.map((p) => p.name).join(", ")}.\n\nResults: ${link}`;
    subject = `PATCH missing responses: ${date}`;
  } else if (d.kind === "complete") {
    subject = `PATCH: everyone responded for ${date}`;
    text = `Everyone has submitted availability for ${date}, including any all-day-unavailable responses.\n\nResults: ${link}`;
  } else {
    text = `Hi ${p.name},\n\n${d.kind === "remind" ? "Reminder: please" : "Please"} submit your PATCH study team availability for ${date}, 8:00 AM–6:00 PM Eastern time (America/New_York). Your personal link lets you submit and edit your availability each week.\n\n${link}\n\nPlease keep this link private. Reply to Brian with any questions.`;
  }
  return {
    from: env.MAIL_FROM,
    to: [p ? p.email : env.ADMIN_EMAIL],
    reply_to: env.REPLY_TO,
    subject,
    text,
    html: `<div style="font-family:system-ui;line-height:1.6">${escape(text).replace(/\n/g, "<br>")}</div>`,
  };
}
export async function drain(env) {
  if (!["live", "test"].includes(env.MAIL_MODE) || (await paused(env))) return;
  if (
    !env.RESEND_API_KEY ||
    !env.MAIL_FROM ||
    !env.ADMIN_EMAIL ||
    !env.REPLY_TO
  )
    throw new Error("Mail configuration is incomplete.");
  for (let i = 0; i < 20; i++) {
    const now = iso(),
      lease = new Date(Date.now() + 120000).toISOString();
    const d = await q(
      env,
      `UPDATE deliveries SET state='sending',lease_until=?,attempts=attempts+1,first_attempt_at=COALESCE(first_attempt_at,?) WHERE id=(SELECT id FROM deliveries WHERE ((state='pending' AND next_at<=?) OR (state='sending' AND lease_until<?)) AND kind!='marker' ORDER BY next_at,id LIMIT 1) RETURNING *`,
      lease,
      now,
      now,
      now,
    ).first();
    if (!d) break;
    try {
      // Resend keeps idempotency keys for 24h. Never blindly retry an uncertain older send.
      if (Date.now() - Date.parse(d.first_attempt_at) > 23 * 3600000) {
        await q(
          env,
          "UPDATE deliveries SET state='review',error='Retry window expired; check Resend before explicit retry.' WHERE id=?",
          d.id,
        ).run();
        continue;
      }
      const msg = await mailContent(env, d);
      if (!msg) {
        await q(
          env,
          "UPDATE deliveries SET state='skipped',error=NULL WHERE id=?",
          d.id,
        ).run();
        continue;
      }
      if (env.MAIL_MODE === "test" || d.job_id.startsWith("test:")) {
        msg.to = [env.ADMIN_EMAIL];
        msg.subject = "[TEST — redirected to admin] " + msg.subject;
      }
      const result = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
          "Idempotency-Key": d.id,
        },
        body: JSON.stringify(msg),
        signal: AbortSignal.timeout(15000),
      });
      if (!result.ok) throw new Error(`Resend HTTP ${result.status}`);
      const payload = await result.json();
      if (!payload.id) throw new Error("Resend response missing delivery ID");
      await q(
        env,
        "UPDATE deliveries SET state='sent',sent_at=?,provider_id=?,error=NULL,lease_until=NULL WHERE id=?",
        iso(),
        payload.id,
        d.id,
      ).run();
    } catch (error) {
      await q(
        env,
        "UPDATE deliveries SET state=?,next_at=?,error=?,lease_until=NULL WHERE id=?",
        d.attempts >= 8 ? "failed" : "pending",
        new Date(
          Date.now() + Math.min(3600, 60 * 2 ** d.attempts) * 1000,
        ).toISOString(),
        String(error.message).slice(0, 200),
        d.id,
      ).run();
    }
  }
}
async function api(req, env, ctx, url) {
  const path = url.pathname,
    method = req.method;
  if (!["GET", "POST"].includes(method))
    throw new HttpError(405, "Method not allowed.");
  if (
    method === "POST" &&
    req.headers.get("Origin") &&
    req.headers.get("Origin") !== url.origin
  )
    throw new HttpError(403, "Cross-origin request rejected.");
  if (path.startsWith("/api/patch/admin")) {
    admin(req, env);
    if (path === "/api/patch/admin" && method === "GET")
      return json(await snapshot(env, weekParam(url), null, true));
    if (method !== "POST") throw new HttpError(405, "Method not allowed.");
    const b = await body(req);
    if (path === "/api/patch/admin/roster") {
      if (!Array.isArray(b.people) || b.people.length !== 5)
        throw new HttpError(400, "Supply the five roster members.");
      for (const p of b.people)
        if (
          !p ||
          typeof p !== "object" ||
          !/^[a-z0-9_-]{1,40}$/.test(p.id) ||
          typeof p.name !== "string" ||
          p.name.length < 1 ||
          p.name.length > 100 ||
          !/^\S+@\S+\.\S+$/.test(p.email) ||
          p.email.length > 254
        )
          throw new HttpError(400, "Invalid roster entry.");
      if (
        new Set(b.people.map((p) => p.id)).size !== 5 ||
        new Set(b.people.map((p) => p.email.toLowerCase())).size !== 5
      )
        throw new HttpError(400, "Roster IDs and emails must be unique.");
      await env.DB.batch([
        ...b.people.map((p) =>
          q(
            env,
            `INSERT INTO participants(id,name,email) VALUES (?,?,?) ON CONFLICT(id) DO UPDATE SET name=excluded.name,email=excluded.email,active=1,token_version=CASE WHEN lower(participants.email)!=lower(excluded.email) OR participants.active=0 THEN participants.token_version+1 ELSE participants.token_version END`,
            p.id,
            p.name,
            p.email,
          ),
        ),
        q(
          env,
          "UPDATE participants SET active=0 WHERE id NOT IN (?,?,?,?,?)",
          ...b.people.map((p) => p.id),
        ),
      ]);
      return json({ ok: true });
    }
    if (path === "/api/patch/admin/link") {
      const p = await q(
        env,
        "SELECT * FROM participants WHERE id=? AND active=1",
        b.id || "",
      ).first();
      if (!p) throw new HttpError(404, "Unknown participant.");
      if (b.rotate) {
        await q(
          env,
          "UPDATE participants SET token_version=token_version+1 WHERE id=?",
          p.id,
        ).run();
        p.token_version++;
      }
      return json({
        url: `${env.PUBLIC_ORIGIN || url.origin}/patch-meetings/#token=${await personalToken(env, p)}`,
      });
    }
    if (path === "/api/patch/admin/pause") {
      if (typeof b.paused !== "boolean")
        throw new HttpError(400, "paused must be boolean");
      await q(
        env,
        "UPDATE settings SET value=? WHERE key='mail_paused'",
        String(b.paused),
      ).run();
      return json({ ok: true });
    }
    if (path === "/api/patch/admin/retry") {
      const d = await q(
        env,
        "SELECT * FROM deliveries WHERE id=?",
        b.id || "",
      ).first();
      if (!d || !["failed", "review"].includes(d.state))
        throw new HttpError(400, "Choose a failed/review delivery.");
      if (d.state === "review" && b.confirmNotDelivered !== true)
        throw new HttpError(
          400,
          "Check Resend and explicitly confirm this delivery was not accepted.",
        );
      await q(
        env,
        "UPDATE deliveries SET state='pending',attempts=0,first_attempt_at=NULL,next_at=?,error=NULL WHERE id=?",
        iso(),
        d.id,
      ).run();
      ctx.waitUntil(drain(env));
      return json({ ok: true });
    }
    if (path === "/api/patch/admin/test-mail") {
      if (env.MAIL_MODE !== "test")
        throw new HttpError(400, "Set MAIL_MODE=test first.");
      const people = await rows(
        q(env, "SELECT id FROM participants WHERE active=1"),
      );
      const friday = currentFriday();
      await ensureWeek(env, friday);
      await env.DB.batch(
        jobStatements(
          env,
          `test:${crypto.randomUUID()}`,
          friday,
          "invite",
          people.map((p) => p.id),
        ),
      );
      ctx.waitUntil(drain(env));
      return json({ ok: true });
    }
    throw new HttpError(404, "Unknown admin action.");
  }
  if (path === "/api/patch/link" && method === "POST") {
    await rate(
      env,
      `ip:${req.headers.get("CF-Connecting-IP") || "local"}`,
      6,
      3600,
    );
    const b = await body(req),
      email = typeof b.email === "string" ? b.email.trim().toLowerCase() : "";
    if (email.length > 254) throw new HttpError(400, "Email is too long.");
    const hash = await signature(env, email);
    await rate(env, `email:${hash}`, 2, 3600);
    const p = await q(
      env,
      "SELECT id FROM participants WHERE email=? COLLATE NOCASE AND active=1",
      email,
    ).first();
    if (p && env.MAIL_MODE === "live" && !(await paused(env))) {
      const friday = currentFriday();
      await ensureWeek(env, friday);
      await env.DB.batch(
        jobStatements(
          env,
          `link:${hash}:${Math.floor(Date.now() / 1800000)}`,
          friday,
          "invite",
          [p.id],
        ),
      );
      ctx.waitUntil(drain(env));
    }
    return json({
      message:
        "If this address is on the team roster and mail is enabled, a personal link will arrive shortly.",
    });
  }
  if (path === "/api/patch/week" && method === "GET") {
    const friday = weekParam(url);
    let p = null;
    if (req.headers.has("Authorization")) p = await participant(req, env);
    return json(await snapshot(env, friday, p));
  }
  if (path === "/api/patch/response" && method === "POST") {
    const p = await participant(req, env);
    await rate(env, `save:${p.id}`, 60, 3600);
    const b = await body(req);
    if (b.friday !== currentFriday())
      throw new HttpError(
        409,
        "This week is now read-only. Open the current week before submitting.",
      );
    let response;
    try {
      response = validateResponse(b);
    } catch (e) {
      throw new HttpError(400, e.message);
    }
    await ensureWeek(env, b.friday);
    await q(
      env,
      `INSERT INTO responses VALUES (?,?,?,?,?) ON CONFLICT(friday,participant_id) DO UPDATE SET slots=excluded.slots,unavailable=excluded.unavailable,updated_at=excluded.updated_at`,
      b.friday,
      p.id,
      JSON.stringify(response.slots),
      +response.unavailable,
      iso(),
    ).run();
    await queueCompletion(env, b.friday);
    ctx.waitUntil(drain(env));
    return json(await snapshot(env, b.friday, p));
  }
  throw new HttpError(404, "Endpoint not found.");
}
export default {
  async fetch(req, env, ctx) {
    const url = new URL(req.url);
    try {
      if (url.pathname.startsWith("/api/patch/"))
        return await api(req, env, ctx, url);
      const response = await env.ASSETS.fetch(req);
      if (url.pathname.startsWith("/patch-meetings")) {
        const h = new Headers(response.headers);
        h.set("X-Robots-Tag", "noindex, nofollow, noarchive");
        h.set("Referrer-Policy", "no-referrer");
        h.set("Cache-Control", "no-store");
        h.set("X-Content-Type-Options", "nosniff");
        h.set(
          "Content-Security-Policy",
          "default-src 'self'; script-src 'self'; style-src 'self'; connect-src 'self'; img-src 'self' data:; frame-ancestors 'none'; base-uri 'none'; form-action 'self'",
        );
        return new Response(response.body, {
          status: response.status,
          headers: h,
        });
      }
      return response;
    } catch (e) {
      if (!(e instanceof HttpError))
        console.error("PATCH request failed", e.name);
      return json(
        {
          error:
            e instanceof HttpError
              ? e.message
              : "The service is temporarily unavailable. Your unsaved selection is safe in this tab.",
        },
        e.status || 503,
      );
    }
  },
  async scheduled(event, env, ctx) {
    ctx.waitUntil(schedule(env));
  },
};
