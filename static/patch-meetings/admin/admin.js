const $ = (id) => document.getElementById(id);
let credential = "",
  paused = true;
async function api(path, body) {
  const r = await fetch("/api/patch/admin" + path, {
    method: body ? "POST" : "GET",
    cache: "no-store",
    headers: {
      Authorization: "Bearer " + credential,
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const b = await r.json();
  if (!r.ok) throw new Error(b.error);
  return b;
}
async function load() {
  try {
    const query = new URLSearchParams(location.search),
      data = await api(
        query.has("week")
          ? "?week=" + encodeURIComponent(query.get("week"))
          : "",
      );
    $("admin-results").hidden = false;
    $("status").textContent = "";
    $("date").textContent = data.friday + " · Friday (Eastern)";
    $("summary").textContent =
      `${data.submitted} of ${data.expected} responses · Mail mode: ${data.mailMode} · Paused: ${data.mailPaused}`;
    if (data.mailWaitingToStart) {
      const start = new Intl.DateTimeFormat("en-US", {
        timeZone: "America/New_York",
        weekday: "long",
        month: "long",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
        timeZoneName: "short",
      }).format(new Date(data.mailStartsAt));
      $("summary").textContent += ` · Scheduled start: ${start}`;
    }
    paused = data.mailPaused;
    $("pause").textContent = paused ? "Resume mail" : "Pause mail";
    $("people").replaceChildren();
    for (const p of data.people) {
      const li = document.createElement("li");
      li.textContent = `${p.name}: ${p.submitted ? (p.unavailable ? "Unavailable all day" : "Submitted") : "Missing"}${p.updatedAt ? " · " + new Date(p.updatedAt).toLocaleString("en-US", { timeZone: "America/New_York", timeZoneName: "short" }) : ""}`;
      if (p.comment) {
        const comment = document.createElement("p");
        comment.textContent = p.comment;
        li.append(comment);
      }
      $("people").append(li);
    }
    $("deliveries").replaceChildren();
    for (const d of data.deliveries) {
      const tr = document.createElement("tr");
      for (const value of [d.id, d.state, d.attempts, d.error || "—"]) {
        const td = document.createElement("td");
        td.textContent = value;
        tr.append(td);
      }
      $("deliveries").append(tr);
    }
    $("heatmap").replaceChildren();
    data.slots.forEach((s, i) => {
      const li = document.createElement("li");
      const time = (m) =>
        `${Math.floor(m / 60) % 12 || 12}:${String(m % 60).padStart(2, "0")} ${m < 720 ? "AM" : "PM"}`;
      li.textContent = `${time(480 + i * 15)}–${time(495 + i * 15)} Eastern: ${s.count}/${data.expected} ${s.names.join(", ")}`;
      $("heatmap").append(li);
    });
  } catch (e) {
    $("status").textContent = e.message;
  }
}
$("login").addEventListener("submit", (e) => {
  e.preventDefault();
  credential = $("credential").value;
  $("credential").value = "";
  load();
});
$("pause").addEventListener("click", async () => {
  try {
    await api("/pause", { paused: !paused });
    await load();
  } catch (e) {
    $("status").textContent = e.message;
  }
});
setInterval(() => {
  if (credential) load();
}, 30000);
