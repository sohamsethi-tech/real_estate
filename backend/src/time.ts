/** Convert a wall-clock date and time in an IANA zone to a UTC Date. */
export function zonedToUtc(date: string, time: string, timeZone = "Australia/Melbourne") {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time)) {
    throw new Error("Use a date and time");
  }
  const utcGuess = new Date(`${date}T${time}:00Z`);
  if (Number.isNaN(utcGuess.getTime())) throw new Error("Use a date and time");
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(utcGuess);
  const get = (type: string) => parts.find((part) => part.type === type)?.value;
  const year = get("year");
  const month = get("month");
  const day = get("day");
  const hour = get("hour");
  const minute = get("minute");
  const second = get("second");
  if (!year || !month || !day || !hour || !minute || !second) throw new Error("Could not read the time zone");
  const rendered = Date.UTC(+year, +month - 1, +day, +hour, +minute, +second);
  return new Date(utcGuess.getTime() - (rendered - utcGuess.getTime()));
}

export function formatMelbourne(value: Date) {
  return new Intl.DateTimeFormat("en-AU", {
    timeZone: "Australia/Melbourne",
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}
