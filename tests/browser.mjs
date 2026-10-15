// Optional browser smoke test. Requires Playwright and Chromium on the host.
import { createRequire } from "node:module";
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { resolve, extname } from "node:path";
import assert from "node:assert/strict";
import { Miniflare } from "miniflare";
import worker, { personalToken } from "../worker/index.mjs";
const { chromium } = createRequire(import.meta.url)("playwright");
const mf = new Miniflare({
  modules: true,
  script: 'export default {fetch(){return new Response("test")}}',
  d1Databases: ["DB"],
});
const DB = await mf.getD1Database("DB");
for (const sql of (await readFile("worker/migrations/0001_patch.sql", "utf8"))
  .split(";")
  .map((s) => s.trim())
  .filter(Boolean))
  await DB.prepare(sql).run();
const env = {
  DB,
  MAIL_MODE: "disabled",
  LINK_SECRET: "browser-fixture-".repeat(4),
  ADMIN_TOKEN: "browser-admin-".repeat(4),
  ASSETS: {
    fetch: async (req) => {
      const path = new URL(req.url).pathname;
      let file = resolve("static", "." + path);
      if (!file.startsWith(resolve("static") + "/"))
        return new Response("", { status: 404 });
      try {
        if ((await stat(file)).isDirectory()) file += "/index.html";
        return new Response(await readFile(file), {
          headers: {
            "Content-Type":
              {
                ".js": "text/javascript",
                ".css": "text/css",
                ".html": "text/html",
              }[extname(file)] || "application/octet-stream",
          },
        });
      } catch {
        return new Response("", { status: 404 });
      }
    },
  },
};
for (let i = 0; i < 5; i++)
  await DB.prepare("INSERT INTO participants(id,name,email) VALUES (?,?,?)")
    .bind(
      "p" + i,
      i === 1 ? 'Josh "Handsome" Bloch' : "Person " + i,
      "p" + i + "@example.invalid",
    )
    .run();
const server = createServer(async (req, res) => {
  try {
    const data = [];
    for await (const chunk of req) data.push(chunk);
    const r = await worker.fetch(
      new Request("http://localhost:8789" + req.url, {
        method: req.method,
        headers: req.headers,
        ...(req.method === "POST" ? { body: Buffer.concat(data) } : {}),
      }),
      env,
      { waitUntil: (p) => p.catch(console.error) },
    );
    res.writeHead(r.status, Object.fromEntries(r.headers));
    res.end(Buffer.from(await r.arrayBuffer()));
  } catch (e) {
    res.writeHead(500);
    res.end(String(e));
  }
});
await new Promise((r) => server.listen(8789, "127.0.0.1", r));
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
  headless: true,
  args: ["--no-sandbox"],
});
try {
  const token = await personalToken(env, { id: "p1", token_version: 1 }),
    url = "http://localhost:8789/patch-meetings/#token=" + token;
  const page = await browser.newPage({
    viewport: { width: 1280, height: 900 },
  });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("dialog", (d) => d.accept());
  await page.goto(url);
  await page.getByText('Your availability, Josh "Handsome" Bloch').waitFor();
  assert.equal(await page.locator(".slot").count(), 40);
  assert.equal(new URL(page.url()).hash, "");
  const first = page.locator(".slot").nth(0);
  await first.scrollIntoViewIfNeeded();
  const a = await first.boundingBox(),
    b = await page.locator(".slot").nth(3).boundingBox();
  await page.mouse.move(a.x + 100, a.y + 15);
  await page.mouse.down();
  await page.mouse.move(b.x + 100, b.y + 15, { steps: 6 });
  await page.mouse.up();
  assert.equal(await page.locator(".slot[aria-pressed=true]").count(), 4);
  await page.route("**/api/patch/response", (route) =>
    route.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({ error: "Fixture save failure" }),
    }),
  );
  await page.getByRole("button", { name: "Submit availability" }).click();
  await page.getByText("Fixture save failure").waitFor();
  assert.equal(await page.locator(".slot[aria-pressed=true]").count(), 4);
  await page.unroute("**/api/patch/response");
  await page.getByRole("button", { name: "Submit availability" }).click();
  await page.getByText("Saved. Thank you", { exact: false }).waitFor();
  assert.equal(await page.locator("#count").textContent(), "1 of 5 responded");
  await page.locator(".slot").nth(5).focus();
  await page.keyboard.press("Space");
  assert.equal(await page.locator(".slot[aria-pressed=true]").count(), 5);
  await page.locator("#unavailable").check();
  await page.getByRole("button", { name: "Submit availability" }).click();
  await page.getByText("Saved. Thank you", { exact: false }).waitFor();
  assert.equal(await page.locator(".slot[aria-pressed=true]").count(), 0);
  await page.goto(url);
  await page.locator("#unavailable:checked").waitFor();
  await page.screenshot({ path: "work/patch-desktop.png", fullPage: true });
  const mobile = await browser.newPage({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  mobile.on("dialog", (d) => d.accept());
  await mobile.goto(url);
  await mobile.locator("#editor").waitFor();
  assert(
    await mobile.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  );
  await mobile.locator(".slot").first().tap();
  assert.equal(await mobile.locator(".slot[aria-pressed=true]").count(), 0);
  await mobile.locator("#touch").check();
  await mobile.locator(".slot").first().tap();
  assert.equal(await mobile.locator(".slot[aria-pressed=true]").count(), 1);
  await mobile.screenshot({ path: "work/patch-mobile.png", fullPage: true });
  await page.goto(
    "http://localhost:8789/patch-meetings/?week=2026-01-02#token=" + token,
  );
  await page.getByText("Historical week", { exact: false }).waitFor();
  await page.locator("#current").click();
  await page.getByText('Your availability, Josh "Handsome" Bloch').waitFor();
  await page.goto("http://localhost:8789/patch-meetings/admin/");
  await page.locator("#credential").fill(token);
  await page.getByRole("button", { name: "View status" }).click();
  await page.getByText("Administrator authorization required.").waitFor();
  await page.locator("#credential").fill(env.ADMIN_TOKEN);
  await page.getByRole("button", { name: "View status" }).click();
  await page.locator("#admin-results:not([hidden])").waitFor();
  assert.equal(await page.locator("#heatmap li").count(), 40);
  assert.deepEqual(errors, []);
  console.log(
    "PASS: desktop drag, keyboard, failed save retention, save/edit/reload, all-day response, mobile touch and layout, protected admin. No real emails sent.",
  );
} finally {
  await browser.close();
  await new Promise((r) => server.close(r));
  await mf.dispose();
}
