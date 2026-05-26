/** Port staff direct-app session expiry — calendar week boundary in Brisbane. */
export const PORT_APP_SESSION_TIMEZONE = "Australia/Brisbane";

function brisbaneLocalParts(date: Date) {
  const fmt = new Intl.DateTimeFormat("en-AU", {
    timeZone: PORT_APP_SESSION_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
  const parts = fmt.formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value ?? 0);
  return {
    hour: get("hour"),
    minute: get("minute"),
    second: get("second"),
  };
}

function daysUntilNextMonday(weekdayShort: string): number {
  const map: Record<string, number> = {
    Sun: 1,
    Mon: 7,
    Tue: 6,
    Wed: 5,
    Thu: 4,
    Fri: 3,
    Sat: 2,
  };
  return map[weekdayShort] ?? 7;
}

function secondsUntilMidnightInBrisbane(from: Date): number {
  const { hour, minute, second } = brisbaneLocalParts(from);
  const elapsed = hour * 3600 + minute * 60 + second;
  return 86400 - elapsed;
}

/** Seconds until next Monday 00:00 in Australia/Brisbane (login Mon → expires following Mon). */
export function secondsUntilNextMonday(from: Date = new Date()): number {
  const weekday = new Intl.DateTimeFormat("en-US", {
    timeZone: PORT_APP_SESSION_TIMEZONE,
    weekday: "short",
  }).format(from);
  const days = daysUntilNextMonday(weekday);
  return (days - 1) * 86400 + secondsUntilMidnightInBrisbane(from);
}
