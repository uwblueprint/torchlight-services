const timestampFormatter = new Intl.DateTimeFormat("en-CA", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "UTC",
});

export function formatTimestamp(value: string): string {
  return timestampFormatter.format(new Date(value));
}
