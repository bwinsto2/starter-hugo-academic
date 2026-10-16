#!/usr/bin/env node
// Credentials come from the environment or ignored private backup, never CLI arguments.
import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { loadAdminToken, resetAdminToken } from "./patch-credentials.mjs";
const [command, arg, output] = process.argv.slice(2);
const directory = fileURLToPath(new URL("../", import.meta.url));
if (command === "reset-admin") {
  const path = await resetAdminToken(directory);
  console.log(
    `Admin password replaced and saved privately at ${path}. Personal links and mail settings are preserved.`,
  );
  process.exit(0);
}
const adminToken = await loadAdminToken(directory);
const config = await readFile(
  new URL("../wrangler.toml", import.meta.url),
  "utf8",
);
const origin =
  process.env.PATCH_ORIGIN ||
  config.match(/^PUBLIC_ORIGIN\s*=\s*"([^"]+)"/m)?.[1];
if (!adminToken || !origin)
  throw new Error(
    "Set PATCH_ADMIN_TOKEN or restore the private credential backup. If the admin password is lost, use patch:admin -- reset-admin with existing Cloudflare credentials. PATCH_ORIGIN defaults to PUBLIC_ORIGIN in wrangler.toml.",
  );
const paths = {
  status: "",
  roster: "/roster",
  link: "/link",
  rotate: "/link",
  pause: "/pause",
  resume: "/pause",
  retry: "/retry",
  "test-mail": "/test-mail",
};
if (!(command in paths))
  throw new Error(
    "Commands: status [Friday], roster ignored-file.json, link ID output-file, rotate ID output-file, pause, resume, retry DELIVERY_ID, test-mail, reset-admin",
  );
let body;
if (command === "roster")
  body = { people: JSON.parse(await readFile(arg, "utf8")) };
if (["link", "rotate"].includes(command)) {
  if (!output)
    throw new Error(
      "Supply an ignored output path for the sensitive personal link.",
    );
  body = { id: arg, rotate: command === "rotate" };
}
if (command === "pause" || command === "resume")
  body = { paused: command === "pause" };
if (command === "retry")
  body = {
    id: arg,
    confirmNotDelivered: process.env.PATCH_CONFIRM_NOT_DELIVERED === "yes",
  };
if (command === "test-mail") body = {};
const path =
  paths[command] +
  (command === "status" && arg ? "?week=" + encodeURIComponent(arg) : "");
const r = await fetch(origin + "/api/patch/admin" + path, {
  method: body ? "POST" : "GET",
  headers: {
    Authorization: "Bearer " + adminToken,
    ...(body ? { "Content-Type": "application/json" } : {}),
  },
  ...(body ? { body: JSON.stringify(body) } : {}),
});
const b = await r.json();
if (!r.ok) throw new Error(b.error);
if (b.url) {
  await writeFile(output, b.url + "\n", { mode: 0o600, flag: "wx" });
  console.log("Personal link saved in the requested private file.");
} else console.log(JSON.stringify(b, null, 2));
