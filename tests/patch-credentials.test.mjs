import test from "node:test";
import assert from "node:assert/strict";
import {
  mkdtemp,
  writeFile,
  readFile,
  stat,
  readdir,
  rm,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  loadAdminToken,
  resetAdminToken,
} from "../scripts/patch-credentials.mjs";

async function fixture(t) {
  const dir = await mkdtemp(join(tmpdir(), "patch-credentials-"));
  t.after(() => rm(dir, { recursive: true, force: true }));
  await writeFile(join(dir, "wrangler.toml"), 'name = "test-worker"\n');
  return dir;
}
const env = {
  CLOUDFLARE_API_TOKEN: "synthetic-provider-token",
  CLOUDFLARE_ACCOUNT_ID: "synthetic-account",
};

test("admin uses explicit environment credential or private backup", async (t) => {
  const dir = await fixture(t);
  assert.equal(await loadAdminToken(dir, {}), undefined);
  await writeFile(
    join(dir, ".patch-activation-secrets.json"),
    JSON.stringify({ ADMIN_TOKEN: "saved-admin" }),
  );
  assert.equal(await loadAdminToken(dir, {}), "saved-admin");
  assert.equal(
    await loadAdminToken(dir, { PATCH_ADMIN_TOKEN: "explicit-admin" }),
    "explicit-admin",
  );
});

test("recovery replaces admin only, preserves signing backup and saves mode 0600", async (t) => {
  const dir = await fixture(t);
  const path = join(dir, ".patch-activation-secrets.json");
  await writeFile(
    path,
    JSON.stringify({
      ADMIN_TOKEN: "old-admin",
      LINK_SECRET: "unchanged-signing-secret",
    }),
  );
  let uploaded;
  assert.equal(
    await resetAdminToken(dir, {
      env,
      putSecret: async (request) => {
        uploaded = request;
      },
    }),
    path,
  );
  const saved = JSON.parse(await readFile(path, "utf8"));
  assert.equal(uploaded.workerName, "test-worker");
  assert.equal(uploaded.token, saved.ADMIN_TOKEN);
  assert.match(saved.ADMIN_TOKEN, /^[a-f0-9]{64}$/);
  assert.equal(saved.LINK_SECRET, "unchanged-signing-secret");
  assert.equal((await stat(path)).mode & 0o777, 0o600);
  assert.equal(
    (await readdir(dir)).filter((p) => p.startsWith(".patch-admin-candidate-"))
      .length,
    0,
  );
});

test("ambiguous provider failure preserves old backup and private candidate", async (t) => {
  const dir = await fixture(t);
  const path = join(dir, ".patch-activation-secrets.json");
  await writeFile(path, JSON.stringify({ ADMIN_TOKEN: "old-admin" }));
  let candidateToken;
  await assert.rejects(
    resetAdminToken(dir, {
      env,
      putSecret: async ({ token }) => {
        candidateToken = token;
        throw new Error("synthetic transport failure");
      },
    }),
    /Admin reset was not confirmed/,
  );
  assert.equal(
    JSON.parse(await readFile(path, "utf8")).ADMIN_TOKEN,
    "old-admin",
  );
  const candidate = (await readdir(dir)).find((p) =>
    p.startsWith(".patch-admin-candidate-"),
  );
  assert.equal(
    JSON.parse(await readFile(join(dir, candidate), "utf8")).ADMIN_TOKEN,
    candidateToken,
  );
  assert.equal((await stat(join(dir, candidate))).mode & 0o777, 0o600);
});

test("missing Cloudflare credentials cannot trigger password replacement", async (t) => {
  const dir = await fixture(t);
  let called = false;
  await assert.rejects(
    resetAdminToken(dir, {
      env: {},
      putSecret: async () => {
        called = true;
      },
    }),
    /existing CLOUDFLARE/,
  );
  assert.equal(called, false);
  assert.deepEqual(await readdir(dir), ["wrangler.toml"]);
});
