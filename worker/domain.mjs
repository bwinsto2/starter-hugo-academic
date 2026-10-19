export const ZONE = "America/New_York";
export function eastern(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    weekday: "short",
  }).formatToParts(now);
  return Object.fromEntries(parts.map((p) => [p.type, p.value]));
}
export function currentFriday(now = new Date()) {
  const p = eastern(now),
    d = new Date(`${p.year}-${p.month}-${p.day}T12:00:00Z`);
  // Sunday before 6 AM still belongs to the previous week's Friday.
  let days = (5 - d.getUTCDay() + 7) % 7;
  if (d.getUTCDay() === 6 || (d.getUTCDay() === 0 && +p.hour < 6))
    days = d.getUTCDay() === 0 ? -2 : -1;
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}
export function validFriday(s) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s || "")) return false;
  const d = new Date(s + "T12:00:00Z");
  return !isNaN(d) && d.toISOString().slice(0, 10) === s && d.getUTCDay() === 5;
}
export function fullDate(friday) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: ZONE,
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(friday + "T16:00:00Z"));
}
export function validateResponse(body) {
  if (
    !Array.isArray(body.slots) ||
    body.slots.length > 40 ||
    body.slots.some((n) => !Number.isInteger(n) || n < 0 || n >= 40) ||
    new Set(body.slots).size !== body.slots.length
  )
    throw new Error("Choose valid 15-minute intervals.");
  if (
    typeof body.unavailable !== "boolean" ||
    (body.unavailable ? body.slots.length !== 0 : body.slots.length === 0)
  )
    throw new Error(
      "Select availability or explicitly choose Unavailable all day.",
    );
  if (
    body.comment !== undefined &&
    (typeof body.comment !== "string" || body.comment.length > 500)
  )
    throw new Error("Keep your comment to 500 characters or fewer.");
  return {
    slots: [...body.slots].sort((a, b) => a - b),
    unavailable: body.unavailable,
    comment: (body.comment || "").trim(),
  };
}
export function heatmap(people, responses) {
  return Array.from({ length: 40 }, (_, slot) => {
    const names = people
      .filter((p) =>
        responses.some(
          (r) =>
            r.participant_id === p.id && JSON.parse(r.slots).includes(slot),
        ),
      )
      .map((p) => p.name);
    return { slot, count: names.length, names };
  });
}
export function dueJobs(now) {
  const p = eastern(now),
    day = new Date(`${p.year}-${p.month}-${p.day}T12:00:00Z`).getUTCDay(),
    minute = +p.hour * 60 + +p.minute;
  // Catch up within the current scheduling week after an outage.
  const elapsed = day === 0 ? -1 : day;
  return {
    invitations: elapsed > 1 || (elapsed === 1 && minute >= 540),
    // Don't catch up Tuesday's reminder on Wednesday and send two at once.
    tuesdayReminders: elapsed === 2 && minute >= 600,
    reminders: elapsed > 3 || (elapsed === 3 && minute >= 600),
  };
}
