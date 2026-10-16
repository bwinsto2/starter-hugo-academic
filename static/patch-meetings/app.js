/* Tokens stay in the URL fragment and tab memory, never localStorage or requests URLs. */
const $ = (id) => document.getElementById(id);
const initial = new URLSearchParams(location.hash.slice(1));
const token = initial.get("token") || "";
if (token)
  $("current").href = "/patch-meetings/#token=" + encodeURIComponent(token);
// Remove credential-bearing fragment before any further navigation.
if (location.hash)
  history.replaceState(null, "", location.pathname + location.search);
const requestedWeek = new URLSearchParams(location.search).get("week");
let state = null,
  selected = new Set(),
  unavailable = false,
  dirty = false,
  saving = false,
  drag = null,
  lastSlot = null,
  ready = false;
const slotButtons = [],
  groupButtons = [];
const compactLayout = matchMedia("(max-width: 700px)");
function layoutTeam() {
  $("team-panel").open = !compactLayout.matches;
}
layoutTeam();
compactLayout.addEventListener("change", layoutTeam);
const times = Array.from({ length: 41 }, (_, i) => {
  const m = 480 + i * 15;
  return `${Math.floor(m / 60) % 12 || 12}:${String(m % 60).padStart(2, "0")} ${m < 720 ? "AM" : "PM"}`;
});
const label = (i) => `${times[i]}–${times[i + 1]}`;
async function api(path, options = {}) {
  const r = await fetch("/api/patch/" + path, {
    ...options,
    cache: "no-store",
    headers: {
      ...(token ? { Authorization: "Bearer " + token } : {}),
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...options.headers,
    },
  });
  const b = await r.json();
  if (!r.ok)
    throw Object.assign(new Error(b.error || "Request failed."), {
      status: r.status,
    });
  return b;
}
function canEdit() {
  return ready && !!state?.me && !state.readOnly && !saving;
}
function detail(i) {
  lastSlot = i;
  const s = state.slots[i];
  $("details").textContent =
    `${label(i)} · ${s.count}/${state.expected} available${s.names.length ? " — " + s.names.join(", ") : "."}`;
}
function paint() {
  slotButtons.forEach((b, i) => {
    const s = state.slots[i],
      fraction = s.count / Math.max(state.expected, 1),
      on = selected.has(i);
    const group = groupButtons[i];
    group.style.setProperty("--heat", `hsl(151 38% ${96 - fraction * 66}%)`);
    group.setAttribute(
      "aria-label",
      `${label(i)} Eastern, ${s.count} of ${state.expected} available. ${s.names.join(", ")}`,
    );
    b.disabled = !canEdit();
    b.setAttribute("aria-pressed", String(on));
    b.setAttribute(
      "aria-label",
      `${label(i)} Eastern${on ? ", selected by you" : ", not selected"}`,
    );
  });
  $("unavailable").checked = unavailable;
  $("save").disabled = !canEdit() || (!selected.size && !unavailable);
  $("clear").disabled = !canEdit();
  $("unavailable").disabled = !canEdit();
  if (lastSlot !== null) detail(lastSlot);
}
function change(i, on) {
  if (!canEdit()) return;
  if (on) selected.add(i);
  else selected.delete(i);
  unavailable = false;
  dirty = true;
  $("save-status").textContent = "Unsaved changes";
  paint();
}
function render(data, initialLoad = false) {
  state = data;
  if (initialLoad) {
    selected = new Set(data.me?.response?.slots || []);
    unavailable = !!data.me?.response?.unavailable;
    ready = true;
  }
  $("date").textContent = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "America/New_York",
  }).format(new Date(data.friday + "T16:00:00Z"));
  $("current").hidden = !data.readOnly;
  $("count").textContent = `${data.submitted} of ${data.expected} responded`;
  $("legend-total").textContent = data.expected;
  $("link-request").hidden = !!data.me;
  $("editor").hidden = !data.me || data.readOnly;
  $("save-bar").hidden = !data.me || data.readOnly;
  $("greeting").textContent = data.me ? data.me.name : "";
  $("notice").textContent = data.readOnly
    ? "Historical week · Read-only. Open the current week to respond."
    : "";
  $("notice").hidden = !data.readOnly;
  const list = $("people");
  list.replaceChildren();
  for (const p of data.people) {
    const li = document.createElement("li"),
      name = document.createElement("strong"),
      status = document.createElement("small");
    name.textContent = p.name;
    status.textContent = p.submitted
      ? p.unavailable
        ? "Unavailable all day"
        : "Availability submitted"
      : "Not responded";
    if (p.updatedAt)
      status.textContent +=
        " · Updated " +
        new Intl.DateTimeFormat("en-US", {
          timeZone: "America/New_York",
          month: "short",
          day: "numeric",
          hour: "numeric",
          minute: "2-digit",
          timeZoneName: "short",
        }).format(new Date(p.updatedAt));
    if (p.submitted) li.classList.add("responded");
    li.title = `${p.name}: ${status.textContent}`;
    status.textContent = p.submitted
      ? p.unavailable
        ? "Unavailable"
        : "Saved"
      : "Waiting";
    li.append(name, status);
    list.append(li);
  }
  paint();
}
for (let i = 0; i < 40; i++) {
  const b = document.createElement("button");
  b.type = "button";
  b.className = "slot" + (i % 4 === 0 ? " hour" : "");
  b.dataset.slot = i;
  b.addEventListener("pointerenter", () => state && detail(i));
  b.addEventListener("keydown", (e) => {
    const next =
      e.key === "ArrowDown"
        ? Math.min(39, i + 1)
        : e.key === "ArrowUp"
          ? Math.max(0, i - 1)
          : null;
    if (next !== null) {
      e.preventDefault();
      slotButtons[next].focus();
    }
  });
  b.addEventListener("focus", () => state && detail(i));
  b.addEventListener("click", (e) => {
    if (e.detail === 0) {
      detail(i);
      if (canEdit()) change(i, !selected.has(i));
    }
  });
  b.addEventListener("pointerdown", (e) => {
    if (!state) return;
    detail(i);
    if (!canEdit() || (e.pointerType === "touch" && !$("touch").checked))
      return;
    if (e.button !== 0) return;
    e.preventDefault();
    b.focus({ preventScroll: true });
    drag = { on: !selected.has(i), last: i, id: e.pointerId };
    change(i, drag.on);
    $("slots").setPointerCapture(e.pointerId);
  });
  slotButtons.push(b);
  $("slots").append(b);
  const group = document.createElement("button");
  group.type = "button";
  group.className = "group-slot" + (i % 4 === 0 ? " hour" : "");
  for (const event of ["focus", "pointerenter", "click"])
    group.addEventListener(event, () => state && detail(i));
  group.addEventListener("keydown", (e) => {
    const next =
      e.key === "ArrowDown"
        ? Math.min(39, i + 1)
        : e.key === "ArrowUp"
          ? Math.max(0, i - 1)
          : null;
    if (next !== null) {
      e.preventDefault();
      groupButtons[next].focus();
    }
  });
  groupButtons.push(group);
  $("group-slots").append(group);
}
for (let hour = 0; hour <= 10; hour++) {
  const tick = document.createElement("span");
  tick.className = "time-label";
  tick.style.setProperty("--hour", hour);
  tick.textContent = times[hour * 4].replace(":00", "");
  $("time-axis").append(tick);
}
$("slots").addEventListener("pointermove", (e) => {
  if (!drag) return;
  const target = document
    .elementFromPoint(e.clientX, e.clientY)
    ?.closest("[data-slot]");
  if (!target) return;
  const i = +target.dataset.slot;
  for (let s = Math.min(i, drag.last); s <= Math.max(i, drag.last); s++)
    change(s, drag.on);
  drag.last = i;
  detail(i);
});
for (const event of ["pointerup", "pointercancel", "lostpointercapture"])
  $("slots").addEventListener(event, () => (drag = null));
$("touch").addEventListener("change", () =>
  $("slots").classList.toggle("touch-edit", $("touch").checked),
);
$("unavailable").addEventListener("change", () => {
  unavailable = $("unavailable").checked;
  if (unavailable) selected.clear();
  dirty = true;
  $("save-status").textContent = "Unsaved changes";
  paint();
});
$("clear").addEventListener("click", () => {
  selected.clear();
  unavailable = false;
  dirty = true;
  $("save-status").textContent = "Select times or choose Unavailable all day.";
  paint();
});
$("save").addEventListener("click", async () => {
  if (!canEdit()) return;
  saving = true;
  paint();
  $("save-status").classList.remove("error");
  $("save-status").textContent = "Saving…";
  try {
    const data = await api("response", {
      method: "POST",
      body: JSON.stringify({
        friday: state.friday,
        slots: [...selected],
        unavailable,
      }),
    });
    dirty = false;
    render(data);
    $("save-status").textContent = "Saved. Thank you.";
  } catch (e) {
    $("save-status").textContent = e.message;
    $("save-status").classList.add("error");
    if (e.status === 409) {
      state.readOnly = true;
      $("notice").textContent = e.message;
      $("notice").hidden = false;
      $("current").hidden = false;
    }
  } finally {
    saving = false;
    paint();
  }
});
$("request").addEventListener("submit", async (e) => {
  e.preventDefault();
  const button = $("request").querySelector("button");
  button.disabled = true;
  try {
    $("request-status").textContent = (
      await api("link", {
        method: "POST",
        body: JSON.stringify({ email: $("email").value }),
        headers: { Authorization: "" },
      })
    ).message;
  } catch (err) {
    $("request-status").textContent = err.message;
  } finally {
    button.disabled = false;
  }
});
async function refresh(first = false) {
  try {
    const week = state?.friday || requestedWeek;
    const data = await api(
      "week" + (week ? "?week=" + encodeURIComponent(week) : ""),
    );
    render(data, first);
  } catch (e) {
    $("notice").textContent = e.message;
    $("notice").hidden = false;
    if (first) {
      $("date").textContent = "Schedule unavailable";
      $("link-request").hidden = false;
    }
  }
}
window.addEventListener("beforeunload", (e) => {
  if (dirty) {
    e.preventDefault();
    e.returnValue = "";
  }
});
refresh(true);
setInterval(() => {
  if (!saving) refresh(!ready);
}, 30000);
