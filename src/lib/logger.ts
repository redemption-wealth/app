type LogLevel = "debug" | "info" | "warn" | "error";

type LogFields = Record<string, unknown>;

const isProduction = process.env.NODE_ENV === "production";

function write(level: LogLevel, message: string, fields?: LogFields): void {
  if (isProduction && (level === "debug" || level === "info")) {
    return;
  }
  const payload = fields ? { ...fields } : undefined;
  const args: unknown[] = payload ? [message, payload] : [message];
  const sink =
    level === "error"
      ? console.error
      : level === "warn"
        ? console.warn
        : console.log;
  sink(...args);
}

export const logger = {
  debug(message: string, fields?: LogFields): void {
    write("debug", message, fields);
  },
  info(message: string, fields?: LogFields): void {
    write("info", message, fields);
  },
  warn(message: string, fields?: LogFields): void {
    write("warn", message, fields);
  },
  error(message: string, fields?: LogFields): void {
    write("error", message, fields);
  },
};
