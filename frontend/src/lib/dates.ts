const timestampFormatter = new Intl.DateTimeFormat("en-CA", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "UTC",
});

const shortDateFormatter = new Intl.DateTimeFormat("en-CA", {
  month: "short",
  day: "numeric",
  timeZone: "UTC",
});

export function formatTimestamp(value: string): string {
  return timestampFormatter.format(new Date(value));
}

export function formatShortDate(value: string): string {
  return shortDateFormatter.format(new Date(value));
}
