import { test, before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { Miniflare } from "miniflare";
import worker, {
  personalToken,
  schedule,
  drain,
  queueCompletion,
} from "../worker/index.mjs";
import {
  currentFriday,
  eastern,
  validFriday,
  validateResponse,
  heatmap,
  dueJobs,
} from "../worker/domain.mjs";
let mf,
  env,
  mail = [],
  fail = false;
const originalFetch = globalThis.fetch;
const people = Array.from({ length: 5 }, (_, i) => ({
  id: `p${i}`,
  name: i === 1 ? 'Josh "Handsome" Bloch' : `Person ${i}`,
  email: `p${i}@example.invalid`,
  token_version: 1,
}));
before(async () => {
  mf = new Miniflare({
    modules: true,
    script: 'export default {fetch(){return new Response("test")}}',
    d1Databases: ["DB"],
  });
  const DB = await mf.getD1Database("DB");
  for (const file of (
    await readdir(new URL("../worker/migrations/", import.meta.url))
  ).sort()) {
    for (const sql of (
      await readFile(
        new URL(`../worker/migrations/${file}`, import.meta.url),
        "utf8",
      )
    )
      .split(";")
      .map((s) => s.trim())
      .filter(Boolean))
      await DB.prepare(sql).run();
  }
  env = {
    DB,
    LINK_SECRET: "test-link-secret-".repeat(4),
    ADMIN_TOKEN: "test-admin-secret-".repeat(4),
    MAIL_MODE: "disabled",
    MAIL_FROM: "PATCH <patch@example.invalid>",
    ADMIN_EMAIL: "admin@example.invalid",
    REPLY_TO: "admin@example.invalid",
    RESEND_API_KEY: "test-only",
    ASSETS: { fetch: async () => new Response("asset") },
  };
  globalThis.fetch = async (url, opts) => {
    assert.equal(url, "https://api.resend.com/emails");
    mail.push({
      key: opts.headers["Idempotency-Key"],
      ...JSON.parse(opts.body),
    });
    return new Response(
      JSON.stringify(fail ? {} : { id: "test-" + mail.length }),
      {
        status: fail ? 503 : 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  };
});
after(async () => {
  globalThis.fetch = originalFetch;
  await mf?.dispose();
});
beforeEach(async () => {
  await env.DB.batch(
    [
      "DELETE FROM deliveries",
      "DELETE FROM jobs",
      "DELETE FROM responses",
      "DELETE FROM weeks",
      "DELETE FROM participants",
      "DELETE FROM rate_limits",
      "UPDATE settings SET value='true' WHERE key='mail_paused'",
    ].map((s) => env.DB.prepare(s)),
  );
  await env.DB.batch(
    people.map((p) =>
      env.DB.prepare(
        "INSERT INTO participants(id,name,email) VALUES (?,?,?)",
      ).bind(p.id, p.name, p.email),
    ),
  );
  env.MAIL_MODE = "disabled";
  delete env.MAIL_START_AT;
  mail = [];
  fail = false;
});
async function request(path, { token, body, method, origin } = {}) {
  const pending = [];
  const headers = {
    ...(token ? { Authorization: "Bearer " + token } : {}),
    ...(body ? { "Content-Type": "application/json" } : {}),
    ...(origin ? { Origin: origin } : {}),
  };
  const r = await worker.fetch(
    new Request("https://test.invalid" + path, {
      method: method || (body ? "POST" : "GET"),
      headers,
      ...(body ? { body: JSON.stringify(body) } : {}),
    }),
    env,
    { waitUntil: (p) => pending.push(p) },
  );
  await Promise.all(pending);
  return { status: r.status, data: await r.json() };
}
async function save(
  i,
  slots = [0, 39],
  unavailable = false,
  friday = currentFriday(),
) {
  return request("/api/patch/response", {
    token: await personalToken(env, people[i]),
    body: { friday, slots, unavailable },
  });
}
async function unpause() {
  await env.DB.prepare(
    "UPDATE settings SET value='false' WHERE key='mail_paused'",
  ).run();
}
const weekTime = (daysBefore, hour) => {
  const d = new Date(currentFriday() + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() - daysBefore);
  return new Date(
    d.toISOString().slice(0, 10) +
      `T${hour}:00:00${+eastern(d).month >= 4 && +eastern(d).month <= 10 ? "-04:00" : "-05:00"}`,
  );
};
test("Friday boundaries include Saturday and pre-6AM Sunday, with DST", () => {
  for (const [now, want] of [
    ["2026-10-16T23:00:00Z", "2026-10-16"],
    ["2026-10-17T23:00:00Z", "2026-10-16"],
    ["2026-10-18T09:59:59Z", "2026-10-16"],
    ["2026-10-18T10:00:00Z", "2026-10-23"],
    ["2026-03-08T09:59:59Z", "2026-03-06"],
    ["2026-03-08T10:00:00Z", "2026-03-13"],
    ["2026-11-01T10:59:59Z", "2026-10-30"],
    ["2026-11-01T11:00:00Z", "2026-11-06"],
    ["2026-12-31T18:00:00Z", "2027-01-01"],
  ])
    assert.equal(currentFriday(new Date(now)), want, now);
  assert.equal(dueJobs(new Date("2026-03-09T12:59:00Z")).invitations, false);
  assert.equal(dueJobs(new Date("2026-03-09T13:00:00Z")).invitations, true);
  assert.equal(dueJobs(new Date("2026-11-02T13:59:00Z")).invitations, false);
  assert.equal(dueJobs(new Date("2026-11-02T14:00:00Z")).invitations, true);
  assert.equal(dueJobs(new Date("2026-03-11T13:59:00Z")).reminders, false);
  assert.equal(dueJobs(new Date("2026-03-11T14:00:00Z")).reminders, true);
  assert.equal(dueJobs(new Date("2026-11-04T14:59:00Z")).reminders, false);
  assert.equal(dueJobs(new Date("2026-11-04T15:00:00Z")).reminders, true);
  for (const [time, due] of [
    ["2026-03-10T13:59:59Z", false],
    ["2026-03-10T14:00:00Z", true],
    ["2026-11-03T14:59:59Z", false],
    ["2026-11-03T15:00:00Z", true],
    ["2026-11-04T15:00:00Z", false],
  ])
    assert.equal(dueJobs(new Date(time)).tuesdayReminders, due, time);
  assert(validFriday("2026-10-16"));
  assert(!validFriday("2026-10-17"));
  assert(!validFriday("2026-02-30"));
});
test("40 intervals, explicit empty response, invalid inputs", () => {
  assert.equal(
    validateResponse({
      slots: Array.from({ length: 40 }, (_, i) => i),
      unavailable: false,
    }).slots.length,
    40,
  );
  for (const body of [
    { slots: [], unavailable: false },
    { slots: [40], unavailable: false },
    { slots: [-1], unavailable: false },
    { slots: [1, 1], unavailable: false },
    { slots: [1], unavailable: true },
    { slots: ["1"], unavailable: false },
  ])
    assert.throws(() => validateResponse(body));
  assert.deepEqual(validateResponse({ slots: [], unavailable: true }), {
    slots: [],
    unavailable: true,
    comment: "",
  });
  assert.equal(heatmap([], []).length, 40);
});
test("participant auth, isolation, edits, missing vs unavailable, safe public results", async () => {
  assert.equal(
    (
      await request("/api/patch/response", {
        body: { friday: currentFriday(), slots: [0], unavailable: false },
      })
    ).status,
    401,
  );
  const forged = (await personalToken(env, people[0])).replace("p0.", "p1.");
  assert.equal(
    (await request("/api/patch/week", { token: forged })).status,
    401,
  );
  assert.equal((await save(0)).status, 200);
  await save(1, [], true);
  const a = (
    await request("/api/patch/week", {
      token: await personalToken(env, people[0]),
    })
  ).data;
  assert.equal(a.submitted, 2);
  assert.equal(a.expected, 5);
  assert.equal(a.people.find((p) => p.id === "p1").unavailable, true);
  assert.equal(a.people.find((p) => p.id === "p2").submitted, false);
  assert.equal(a.slots[0].count, 1);
  assert.equal(a.slots[39].count, 1);
  assert.deepEqual(a.me.response.slots, [0, 39]);
  await save(0, [4]);
  const b = (await request("/api/patch/week")).data;
  assert.equal(b.slots[0].count, 0);
  assert.equal(b.slots[4].count, 1);
  assert(!JSON.stringify(b).includes("example.invalid"));
  assert(!JSON.stringify(b).includes("token_version"));
  assert.equal(b.me, null);
  assert.equal(
    (
      await request("/api/patch/admin", {
        token: await personalToken(env, people[0]),
      })
    ).status,
    401,
  );
  assert.equal(
    (await request("/api/patch/admin", { token: env.ADMIN_TOKEN })).status,
    200,
  );
});
test("optional comments are saved, shared, editable and validated without changing response rules", async () => {
  const token = await personalToken(env, people[0]);
  const submit = (
    comment,
    slots = [3],
    unavailable = false,
    friday = currentFriday(),
  ) =>
    request("/api/patch/response", {
      token,
      body: { friday, slots, unavailable, comment },
    });
  assert.equal((await submit("  Faculty retreat  ")).status, 200);
  let shared = (await request("/api/patch/week")).data;
  assert.equal(shared.people[0].comment, "Faculty retreat");
  assert.equal(shared.slots[3].count, 1);
  const mine = (await request("/api/patch/week", { token })).data;
  assert.equal(mine.me.response.comment, "Faculty retreat");
  assert.equal((await submit("Out all day", [], true)).status, 200);
  shared = (await request("/api/patch/admin", { token: env.ADMIN_TOKEN })).data;
  assert.equal(shared.people[0].comment, "Out all day");
  assert.equal(shared.people[0].unavailable, true);
  assert.equal(shared.submitted, 1);
  for (const bad of [null, 4, {}, "x".repeat(501)]) {
    assert.equal((await submit(bad)).status, 400);
  }
  assert.equal((await submit("No valid availability", [], false)).status, 400);
  assert.equal((await submit("x".repeat(500))).status, 200);
  assert.equal((await submit("")).data.me.response.comment, "");
  assert.equal(
    (await submit("Won't overwrite history", [0], false, "2026-01-02")).status,
    409,
  );
  // Existing response writers remain compatible during the additive migration.
  await env.DB.prepare("INSERT INTO responses VALUES (?,?,?,?,?)")
    .bind(currentFriday(), "p1", "[]", 1, new Date().toISOString())
    .run();
  shared = (await request("/api/patch/week")).data;
  assert.equal(shared.people[1].comment, "");
  assert.equal(shared.people[1].submitted, true);
});
test("old links and stale submissions cannot overwrite history or new week", async () => {
  await save(0);
  const old = "2026-01-02";
  await env.DB.prepare("INSERT INTO weeks VALUES (?,?)")
    .bind(old, new Date().toISOString())
    .run();
  const result = await request("/api/patch/week?week=" + old, {
    token: await personalToken(env, people[0]),
  });
  assert.equal(result.data.readOnly, true);
  assert.equal(result.data.me.response, null);
  assert.equal((await save(0, [2], false, old)).status, 409);
  assert.equal((await request("/api/patch/week?week=2099-01-02")).status, 400);
  assert.equal(
    (
      await request("/api/patch/response", {
        token: await personalToken(env, people[0]),
        body: { friday: currentFriday(), slots: [1], unavailable: false },
        origin: "https://evil.invalid",
      })
    ).status,
    403,
  );
});
test("concurrent final responses create exactly one completion, later edits do not resend", async () => {
  for (let i = 0; i < 3; i++) await save(i);
  await Promise.all([save(3, [], true), save(4)]);
  assert.equal(
    (
      await env.DB.prepare(
        "SELECT count(*) AS n FROM deliveries WHERE kind='complete'",
      ).first()
    ).n,
    1,
  );
  env.MAIL_MODE = "live";
  await unpause();
  await Promise.all([drain(env), drain(env)]);
  assert.equal(mail.length, 1);
  assert(mail[0].subject.includes("everyone responded"));
  await save(4, [3]);
  assert.equal(mail.length, 1);
});
test("Monday invitations individually sent once and Wednesday reminders target only missing", async () => {
  env.MAIL_MODE = "live";
  await unpause();
  await schedule(env, weekTime(4, "09"));
  assert.equal(mail.length, 5);
  assert.equal(new Set(mail.map((m) => m.to[0])).size, 5);
  assert(
    mail.every(
      (m) =>
        m.text.includes(currentFriday().slice(0, 4)) &&
        m.text.includes("Eastern") &&
        m.text.includes("#token="),
    ),
  );
  assert(mail.every((m) => m.reply_to === env.REPLY_TO));
  await schedule(env, weekTime(4, "09"));
  assert.equal(mail.length, 5);
  await save(0);
  await save(1, [], true);
  mail = [];
  await schedule(env, weekTime(2, "10"));
  assert.equal(mail.length, 4);
  assert.equal(mail.filter((m) => m.to[0] === env.ADMIN_EMAIL).length, 1);
  assert(
    !mail.some(
      (m) => m.to[0] === people[0].email || m.to[0] === people[1].email,
    ),
  );
  assert(mail.find((m) => m.to[0] === env.ADMIN_EMAIL).text.includes("2 of 5"));
  await schedule(env, weekTime(2, "10"));
  assert.equal(mail.length, 4);
  // Late Thursday completion still sends one completion notification.
  await save(2);
  await save(3);
  await save(4);
  assert.equal(
    mail.filter((m) => m.subject.includes("everyone responded")).length,
    1,
  );
});
test("Tuesday and Wednesday reminders use separate receipts and only contact missing respondents", async (t) => {
  t.mock.timers.enable({
    apis: ["Date"],
    now: new Date("2026-10-19T13:00:00Z"),
  });
  env.MAIL_MODE = "live";
  await unpause();
  await schedule(env);
  assert.equal(mail.length, 5);
  await save(0);
  await save(1, [], true);
  mail = [];
  t.mock.timers.setTime(new Date("2026-10-20T13:59:59Z").getTime());
  await schedule(env);
  assert.equal(mail.length, 0);
  t.mock.timers.setTime(new Date("2026-10-20T14:00:00Z").getTime());
  await Promise.all([schedule(env), schedule(env)]);
  assert.deepEqual(
    mail.map((m) => m.to[0]).sort(),
    people.slice(2).map((p) => p.email),
  );
  assert(mail.every((m) => m.key.includes(":remind-tuesday:")));
  await schedule(env);
  assert.equal(mail.length, 3);
  await save(2);
  mail = [];
  t.mock.timers.setTime(new Date("2026-10-21T13:59:59Z").getTime());
  await schedule(env);
  assert.equal(mail.length, 0);
  t.mock.timers.setTime(new Date("2026-10-21T14:00:00Z").getTime());
  await schedule(env);
  assert.deepEqual(
    mail.map((m) => m.to[0]).sort(),
    [env.ADMIN_EMAIL, people[3].email, people[4].email].sort(),
  );
  assert(mail.every((m) => m.key.includes(":remind:")));
  await schedule(env);
  assert.equal(mail.length, 3);
});
test("Tuesday retries skip submitted responses and expire before Wednesday's reminder", async (t) => {
  t.mock.timers.enable({
    apis: ["Date"],
    now: new Date("2026-10-20T14:00:00Z"),
  });
  env.MAIL_MODE = "live";
  await unpause();
  fail = true;
  await schedule(env);
  await save(0, [], true);
  mail = [];
  fail = false;
  await env.DB.prepare("UPDATE deliveries SET next_at='2000-01-01'").run();
  await drain(env);
  assert(!mail.some((m) => m.key.endsWith(":remind-tuesday:p0")));
  // Simulate an uncertain Tuesday delivery becoming due just as Wednesday starts.
  await env.DB.prepare(
    "UPDATE deliveries SET state='pending',first_attempt_at=NULL,next_at='2000-01-01' WHERE id=?",
  )
    .bind("2026-10-23:remind-tuesday:p1")
    .run();
  mail = [];
  t.mock.timers.setTime(new Date("2026-10-21T14:00:00Z").getTime());
  await schedule(env);
  assert(!mail.some((m) => m.key.includes(":remind-tuesday:")));
  assert.equal(
    (
      await env.DB.prepare("SELECT state FROM deliveries WHERE id=?")
        .bind("2026-10-23:remind-tuesday:p1")
        .first()
    ).state,
    "skipped",
  );
});
test("scheduled launch blocks every live sending path until Monday and starts the correct Friday once", async (t) => {
  t.mock.timers.enable({
    apis: ["Date"],
    now: new Date("2026-10-16T17:00:00Z"),
  });
  env.MAIL_MODE = "live";
  env.MAIL_START_AT = "2026-10-19T13:00:00Z";
  await unpause();
  await schedule(env);
  assert.equal(
    (await env.DB.prepare("SELECT count(*) AS n FROM jobs").first()).n,
    0,
  );
  for (let i = 0; i < 5; i++) await save(i);
  // A queued current-week completion and recovery request must not bypass launch.
  await request("/api/patch/link", { body: { email: people[0].email } });
  assert.equal(
    (await env.DB.prepare("SELECT count(*) AS n FROM jobs").first()).n,
    1,
  );
  assert.equal(
    (await env.DB.prepare("SELECT attempts FROM deliveries").first()).attempts,
    0,
  );
  for (const time of ["2026-10-18T10:00:00Z", "2026-10-19T12:59:59Z"]) {
    t.mock.timers.setTime(new Date(time).getTime());
    await schedule(env);
    await drain(env);
    assert.equal(mail.length, 0);
    assert.equal(
      (await env.DB.prepare("SELECT count(*) AS n FROM jobs").first()).n,
      1,
    );
  }
  const beforeStart = await request("/api/patch/admin", {
    token: env.ADMIN_TOKEN,
  });
  assert.equal(beforeStart.data.mailWaitingToStart, true);
  assert.equal(beforeStart.data.mailStartsAt, env.MAIL_START_AT);
  t.mock.timers.setTime(new Date("2026-10-19T13:00:00Z").getTime());
  await schedule(env);
  assert.equal(mail.length, 5);
  assert.equal(new Set(mail.map((m) => m.to[0])).size, 5);
  assert(
    mail.every(
      (m) =>
        m.text.includes("week=2026-10-23") &&
        m.subject.includes("Friday, October 23, 2026"),
    ),
  );
  assert.equal(
    (
      await env.DB.prepare(
        "SELECT state FROM deliveries WHERE kind='complete'",
      ).first()
    ).state,
    "skipped",
  );
  assert.equal(
    (
      await env.DB.prepare(
        "SELECT count(*) AS n FROM deliveries WHERE kind='remind'",
      ).first()
    ).n,
    0,
  );
  t.mock.timers.setTime(new Date("2026-10-19T13:15:00Z").getTime());
  await schedule(env);
  assert.equal(mail.length, 5);
  const afterStart = await request("/api/patch/admin", {
    token: env.ADMIN_TOKEN,
  });
  assert.equal(afterStart.data.mailWaitingToStart, false);
  t.mock.timers.setTime(new Date("2026-10-21T13:59:59Z").getTime());
  await schedule(env);
  assert.equal(mail.length, 5);
  t.mock.timers.setTime(new Date("2026-10-21T14:00:00Z").getTime());
  await schedule(env);
  assert.equal(mail.length, 11); // five missing-person reminders and one admin status
});
test("invalid scheduled launch fails closed for scheduler and direct draining", async () => {
  env.MAIL_MODE = "live";
  env.MAIL_START_AT = "invalid";
  await unpause();
  await assert.rejects(schedule(env), /MAIL_START_AT/);
  await assert.rejects(drain(env), /MAIL_START_AT/);
  assert.equal(mail.length, 0);
});
test("weekly mail stays at 9 AM Eastern after the scheduled launch and DST change", async (t) => {
  t.mock.timers.enable({
    apis: ["Date"],
    now: new Date("2026-11-02T13:59:59Z"),
  });
  env.MAIL_MODE = "live";
  env.MAIL_START_AT = "2026-10-19T13:00:00Z";
  await unpause();
  await schedule(env);
  assert.equal(mail.length, 0);
  t.mock.timers.setTime(new Date("2026-11-02T14:00:00Z").getTime());
  await schedule(env);
  assert.equal(mail.length, 5);
  assert(mail.every((m) => m.text.includes("week=2026-11-06")));
});
test("manual scheduler recovery requires admin and honors mode, pause, start time and idempotency", async (t) => {
  t.mock.timers.enable({
    apis: ["Date"],
    now: new Date("2026-10-19T15:00:00Z"),
  });
  assert.equal(
    (await request("/api/patch/admin/run", { body: {} })).status,
    401,
  );
  assert.equal(
    (
      await request("/api/patch/admin/run", {
        token: await personalToken(env, people[0]),
        body: {},
      })
    ).status,
    401,
  );
  const run = () =>
    request("/api/patch/admin/run", { token: env.ADMIN_TOKEN, body: {} });
  assert.equal((await run()).status, 200);
  assert.equal(mail.length, 0);
  env.MAIL_MODE = "live";
  await run();
  assert.equal(mail.length, 0);
  await unpause();
  env.MAIL_START_AT = "2026-10-20T13:00:00Z";
  await run();
  assert.equal(mail.length, 0);
  env.MAIL_START_AT = "2026-10-19T13:00:00Z";
  await run();
  assert.equal(mail.length, 5);
  assert(mail.every((m) => m.text.includes("week=2026-10-23")));
  await run();
  assert.equal(mail.length, 5);
});
test("manual reminders require admin, current week and live unpaused mail", async (t) => {
  t.mock.timers.enable({
    apis: ["Date"],
    now: new Date("2026-10-19T15:00:00Z"),
  });
  const payload = {
    friday: currentFriday(),
    requestId: "00000000-0000-4000-8000-000000000001",
  };
  const remind = (token = env.ADMIN_TOKEN, body = payload) =>
    request("/api/patch/admin/remind", { token, body });
  assert.equal((await remind("")).status, 401);
  assert.equal((await remind(await personalToken(env, people[0]))).status, 401);
  assert.equal((await remind()).status, 409); // disabled
  env.MAIL_MODE = "test";
  await unpause();
  assert.equal((await remind()).status, 409);
  env.MAIL_MODE = "live";
  await env.DB.prepare(
    "UPDATE settings SET value='true' WHERE key='mail_paused'",
  ).run();
  assert.equal((await remind()).status, 409);
  await unpause();
  env.MAIL_START_AT = "2026-10-20T13:00:00Z";
  assert.equal((await remind()).status, 409);
  delete env.MAIL_START_AT;
  assert.equal(
    (await remind(env.ADMIN_TOKEN, { ...payload, friday: "2026-10-16" }))
      .status,
    409,
  );
  assert.equal(
    (await remind(env.ADMIN_TOKEN, { ...payload, requestId: "bad" })).status,
    400,
  );
  assert.equal(
    (await env.DB.prepare("SELECT count(*) AS n FROM jobs").first()).n,
    0,
  );
  assert.equal(mail.length, 0);
});
test("manual reminders name respondents, target only missing, and deduplicate concurrent/repeated requests", async () => {
  await save(0);
  await save(1, [], true);
  env.MAIL_MODE = "live";
  await unpause();
  const body = {
    friday: currentFriday(),
    requestId: "00000000-0000-4000-8000-000000000002",
  };
  const remind = () =>
    request("/api/patch/admin/remind", { token: env.ADMIN_TOKEN, body });
  const results = await Promise.all([remind(), remind()]);
  assert(
    results.every((r) => r.status === 200 && r.data.recipients.length === 3),
  );
  assert.deepEqual(
    mail.map((m) => m.to[0]).sort(),
    people.slice(2).map((p) => p.email),
  );
  for (const msg of mail) {
    const recipient = people.find((p) => p.email === msg.to[0]);
    assert(msg.text.startsWith(`Hi ${recipient.name},`));
    assert(
      msg.text.includes(
        'Josh "Handsome" Bloch and Person 0 have submitted availability',
      ),
    );
    assert(msg.html.includes("Josh &quot;Handsome&quot; Bloch"));
    assert(msg.text.includes("Please share yours here:"));
    assert(
      msg.text.includes("#token=" + (await personalToken(env, recipient))),
    );
    assert(msg.text.includes("week=" + currentFriday()));
    assert(!msg.text.includes(people[1].email));
  }
  await remind();
  assert.equal(mail.length, 3);
  // Manual sending must not consume either scheduled reminder batch.
  await schedule(env, weekTime(3, "10"));
  assert.equal(
    mail.filter((m) => m.key.includes(":remind-tuesday:")).length,
    3,
  );
  assert(
    mail
      .filter((m) => m.key.includes(":remind-tuesday:"))
      .every((m) => m.text.includes("have submitted availability")),
  );
});
test("manual reminders recheck respondents on retries, handle nobody/everybody and retain delivery receipts", async () => {
  env.MAIL_MODE = "live";
  await unpause();
  const body = {
    friday: currentFriday(),
    requestId: "00000000-0000-4000-8000-000000000003",
  };
  fail = true;
  await request("/api/patch/admin/remind", { token: env.ADMIN_TOKEN, body });
  assert.equal(mail.length, 5);
  assert(
    mail.every((m) => m.text.includes("No one has submitted availability")),
  );
  await save(0, [], true);
  mail = [];
  fail = false;
  await env.DB.prepare("UPDATE deliveries SET next_at='2000-01-01'").run();
  await drain(env);
  assert.equal(mail.length, 4);
  assert(!mail.some((m) => m.to[0] === people[0].email));
  assert(
    mail.every((m) => m.text.includes("Person 0 has submitted availability")),
  );
  const receipts = (
    await env.DB.prepare(
      "SELECT id,provider_id FROM deliveries WHERE state='sent' ORDER BY id",
    ).all()
  ).results;
  await request("/api/patch/admin/remind", { token: env.ADMIN_TOKEN, body });
  assert.equal(mail.length, 4);
  assert.deepEqual(
    (
      await env.DB.prepare(
        "SELECT id,provider_id FROM deliveries WHERE state='sent' ORDER BY id",
      ).all()
    ).results,
    receipts,
  );
  for (let i = 1; i < 5; i++) await save(i);
  mail = [];
  const allDone = await request("/api/patch/admin/remind", {
    token: env.ADMIN_TOKEN,
    body: { ...body, requestId: "00000000-0000-4000-8000-000000000004" },
  });
  assert.deepEqual(allDone.data.recipients, []);
  assert.equal(mail.length, 0);
});
test("everyone responded Wednesday skips reminders/status", async () => {
  for (let i = 0; i < 5; i++) await save(i);
  env.MAIL_MODE = "live";
  await unpause();
  await schedule(env, weekTime(2, "10"));
  assert.equal(
    (
      await env.DB.prepare(
        "SELECT count(*) AS n FROM deliveries WHERE kind IN ('remind','status')",
      ).first()
    ).n,
    0,
  );
});
test("provider failures retained, retry idempotency, test mode redirects, pause prevents mail", async () => {
  for (let i = 0; i < 5; i++) await save(i);
  env.MAIL_MODE = "test";
  await unpause();
  fail = true;
  await drain(env);
  const d = await env.DB.prepare(
    "SELECT * FROM deliveries WHERE kind='complete'",
  ).first();
  assert.equal(d.state, "pending");
  assert.match(d.error, /503/);
  fail = false;
  await env.DB.prepare("UPDATE deliveries SET next_at='2000-01-01'").run();
  await drain(env);
  assert.equal(mail[0].key, mail[1].key);
  assert.equal(mail[1].to[0], env.ADMIN_EMAIL);
  const result = await request("/api/patch/admin/test-mail", {
    token: env.ADMIN_TOKEN,
    body: {},
  });
  assert.equal(result.status, 200);
  assert(mail.every((m) => m.to.length === 1 && m.to[0] === env.ADMIN_EMAIL));
  await request("/api/patch/admin/pause", {
    token: env.ADMIN_TOKEN,
    body: { paused: true },
  });
  const count = mail.length;
  await request("/api/patch/admin/test-mail", {
    token: env.ADMIN_TOKEN,
    body: {},
  });
  assert.equal(mail.length, count);
});
test("uncertain delivery outside provider idempotency window needs review", async () => {
  for (let i = 0; i < 5; i++) await save(i);
  env.MAIL_MODE = "live";
  await unpause();
  await env.DB.prepare(
    "UPDATE deliveries SET first_attempt_at='2000-01-01'",
  ).run();
  await drain(env);
  assert.equal(mail.length, 0);
  assert.equal(
    (await env.DB.prepare("SELECT state FROM deliveries").first()).state,
    "review",
  );
  assert.equal(
    (
      await request("/api/patch/admin/retry", {
        token: env.ADMIN_TOKEN,
        body: { id: currentFriday() + ":complete:admin" },
      })
    ).status,
    400,
  );
});
test("reminder rechecks responses when retrying, secure link rotation and recovery rate limits", async () => {
  env.MAIL_MODE = "live";
  await unpause();
  fail = true;
  await schedule(env, weekTime(2, "10"));
  await save(2);
  mail = [];
  fail = false;
  await env.DB.prepare("UPDATE deliveries SET next_at='2000-01-01'").run();
  await drain(env);
  assert(!mail.some((m) => m.key === `${currentFriday()}:remind:p2`));
  const old = await personalToken(env, people[0]);
  assert.equal(
    (
      await request("/api/patch/admin/link", {
        token: env.ADMIN_TOKEN,
        body: { id: "p0", rotate: true },
      })
    ).status,
    200,
  );
  assert.equal((await request("/api/patch/week", { token: old })).status, 401);
  env.MAIL_MODE = "disabled";
  const known = await request("/api/patch/link", {
      body: { email: people[0].email },
    }),
    unknown = await request("/api/patch/link", {
      body: { email: "unknown@example.invalid" },
    });
  assert.deepEqual(known, unknown);
  await request("/api/patch/link", {
    body: { email: "unknown@example.invalid" },
  });
  assert.equal(
    (
      await request("/api/patch/link", {
        body: { email: "unknown@example.invalid" },
      })
    ).status,
    429,
  );
});
test("standalone page uses no Hugo content listing and has discovery/referrer directives", async () => {
  const html = await readFile(
    new URL("../static/patch-meetings/index.html", import.meta.url),
    "utf8",
  );
  assert.match(html, /noindex,nofollow/);
  assert.match(html, /no-referrer/);
  assert(!html.includes("analytics"));
  const r = await worker.fetch(
    new Request("https://test.invalid/patch-meetings/"),
    env,
    {},
  );
  assert.match(r.headers.get("X-Robots-Tag"), /noindex/);
  assert.equal(r.headers.get("Referrer-Policy"), "no-referrer");
});
test("roster maintenance preserves stable links, email changes revoke, duplicates rejected", async () => {
  const token = await personalToken(env, people[0]);
  const roster = people.map(({ id, name, email }) => ({ id, name, email }));
  assert.equal(
    (
      await request("/api/patch/admin/roster", {
        token: env.ADMIN_TOKEN,
        body: { people: roster },
      })
    ).status,
    200,
  );
  assert.equal((await request("/api/patch/week", { token })).status, 200);
  roster[0].email = "new@example.invalid";
  assert.equal(
    (
      await request("/api/patch/admin/roster", {
        token: env.ADMIN_TOKEN,
        body: { people: roster },
      })
    ).status,
    200,
  );
  assert.equal((await request("/api/patch/week", { token })).status, 401);
  roster[1].id = roster[0].id;
  assert.equal(
    (
      await request("/api/patch/admin/roster", {
        token: env.ADMIN_TOKEN,
        body: { people: roster },
      })
    ).status,
    400,
  );
});
test("pending test jobs stay redirected even after live activation", async () => {
  env.MAIL_MODE = "test";
  await request("/api/patch/admin/test-mail", {
    token: env.ADMIN_TOKEN,
    body: {},
  });
  assert.equal(mail.length, 0);
  env.MAIL_MODE = "live";
  await unpause();
  await drain(env);
  assert.equal(mail.length, 5);
  assert(
    mail.every(
      (m) => m.to[0] === env.ADMIN_EMAIL && m.subject.startsWith("[TEST"),
    ),
  );
});
test("malformed non-object JSON is rejected", async () => {
  const r = await worker.fetch(
    new Request("https://test.invalid/api/patch/response", {
      method: "POST",
      headers: {
        Authorization: "Bearer " + (await personalToken(env, people[0])),
      },
      body: "null",
    }),
    env,
    { waitUntil() {} },
  );
  assert.equal(r.status, 400);
});
