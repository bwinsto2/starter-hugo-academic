import { randomBytes } from "node:crypto";
import { readFile, writeFile, rename } from "node:fs/promises";
import { join } from "node:path";
import { spawn } from "node:child_process";

const backupName = ".patch-activation-secrets.json";

async function readBackup(directory) {
  try {
    const value = JSON.parse(
      await readFile(join(directory, backupName), "utf8"),
    );
    if (!value || typeof value !== "object" || Array.isArray(value))
      throw new Error("Invalid credential backup.");
    return value;
  } catch (error) {
    if (error.code === "ENOENT") return {};
    throw new Error(
      "Unable to read the private credential backup; check its permissions and JSON format.",
    );
  }
}

export async function loadAdminToken(directory, env = process.env) {
  return env.PATCH_ADMIN_TOKEN || (await readBackup(directory)).ADMIN_TOKEN;
}

async function putAdminSecret({ directory, workerName, token, env }) {
  await new Promise((resolve, reject) => {
    const child = spawn(
      process.execPath,
      [
        join(directory, "node_modules/wrangler/bin/wrangler.js"),
        "secret",
        "put",
        "ADMIN_TOKEN",
        "--name",
        workerName,
      ],
      {
        cwd: directory,
        env: { ...env, WRANGLER_SEND_METRICS: "false" },
        stdio: ["pipe", "ignore", "ignore"],
      },
    );
    child.on("error", reject);
    child.on("close", (code) =>
      code === 0
        ? resolve()
        : reject(new Error("Secret update was not confirmed.")),
    );
    child.stdin.on("error", reject);
    child.stdin.end(token + "\n");
  });
}

// Changes only ADMIN_TOKEN via Wrangler's dedicated secret command. Never rotates
// LINK_SECRET, participant versions, roster, other secrets, or mail settings.
export async function resetAdminToken(
  directory,
  { env = process.env, putSecret = putAdminSecret } = {},
) {
  if (!env.CLOUDFLARE_API_TOKEN || !env.CLOUDFLARE_ACCOUNT_ID)
    throw new Error(
      "Admin recovery needs the existing CLOUDFLARE_API_TOKEN and CLOUDFLARE_ACCOUNT_ID.",
    );
  const config = await readFile(join(directory, "wrangler.toml"), "utf8");
  const workerName = config.match(/^name\s*=\s*"([^"]+)"/m)?.[1];
  if (!workerName)
    throw new Error("Worker name is missing from wrangler.toml.");
  const backup = await readBackup(directory);
  const token = randomBytes(32).toString("hex");
  const candidate = join(
    directory,
    `.patch-admin-candidate-${randomBytes(8).toString("hex")}.json`,
  );
  await writeFile(
    candidate,
    JSON.stringify({ ...backup, ADMIN_TOKEN: token }) + "\n",
    { mode: 0o600, flag: "wx" },
  );
  try {
    await putSecret({ directory, workerName, token, env });
  } catch {
    // A network failure can be ambiguous. Retain the candidate so an accepted
    // update never leaves the operator without the newly generated credential.
    throw new Error(
      `Admin reset was not confirmed. Candidate credentials are saved privately at ${candidate}; verify before retrying.`,
    );
  }
  await rename(candidate, join(directory, backupName));
  return join(directory, backupName);
}
