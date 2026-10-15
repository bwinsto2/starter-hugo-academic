#!/usr/bin/env node
// Credential values are read from the environment, never command-line arguments.
import { readFile, writeFile } from "node:fs/promises";
const [command, arg, output] = process.argv.slice(2);
if (!process.env.PATCH_ADMIN_TOKEN || !process.env.PATCH_ORIGIN)
  throw new Error("Set PATCH_ORIGIN and PATCH_ADMIN_TOKEN in your shell.");
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
    "Commands: status [Friday], roster ignored-file.json, link ID output-file, rotate ID output-file, pause, resume, retry DELIVERY_ID, test-mail",
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
const r = await fetch(process.env.PATCH_ORIGIN + "/api/patch/admin" + path, {
  method: body ? "POST" : "GET",
  headers: {
    Authorization: "Bearer " + process.env.PATCH_ADMIN_TOKEN,
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
