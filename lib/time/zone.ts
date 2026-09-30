/** Dates shown with the viewer's own time zone, so a scheduled reveal is never ambiguous. */

/** The viewer's IANA time zone, e.g. "Asia/Kolkata" (empty on very old browsers). */
export function localZone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone ?? "";
  } catch {
    return "";
  }
}

/** "Sat, Oct 3, 9:00 PM GMT+5:30" in the viewer's time zone. */
export function fmtZoned(date: Date | string, opts: { weekday?: boolean } = {}) {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleString(undefined, {
    ...(opts.weekday === false ? {} : { weekday: "short" }),
    month: "short",
    day: "numeric",
    year: d.getFullYear() === new Date().getFullYear() ? undefined : "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  });
}

/** The viewer's zone as people say it: "India Standard Time", "Pacific Daylight Time". Falls back to the city. */
export function zoneName(at: Date = new Date()) {
  try {
    const part = new Intl.DateTimeFormat(undefined, { timeZoneName: "long" }).formatToParts(at).find((p) => p.type === "timeZoneName");
    if (part?.value) return part.value;
  } catch {}
  return localZone().split("/").pop()?.replace(/_/g, " ") ?? "";
}
