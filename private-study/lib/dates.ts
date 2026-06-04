const DATE_PARTS = /^(\d{4})-(\d{2})-(\d{2})$/;

export function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export function parseIsoDate(date: string) {
  const match = DATE_PARTS.exec(date);
  if (!match) {
    throw new Error(`Invalid ISO date: ${date}`);
  }

  return new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
}

export function addDays(date: string, days: number) {
  const next = parseIsoDate(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next.toISOString().slice(0, 10);
}

export function diffDays(left: string, right: string) {
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.round((parseIsoDate(left).getTime() - parseIsoDate(right).getTime()) / msPerDay);
}
