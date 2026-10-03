type LogLevel = "info" | "warn" | "error";

export function logEvent(level: LogLevel, event: string, context: Record<string, string | number | boolean> = {}) {
  const record = JSON.stringify({
    timestamp: new Date().toISOString(),
    level,
    service: "iris-studio",
    event,
    ...context,
  });

  if (level === "error") console.error(record);
  else if (level === "warn") console.warn(record);
  else console.info(record);
}
