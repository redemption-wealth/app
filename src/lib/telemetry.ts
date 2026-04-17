import { logger } from "@/lib/logger";

type Context = Record<string, unknown>;

interface SentryLike {
  captureException(error: unknown, context?: unknown): void;
  captureMessage(message: string, context?: unknown): void;
}

function resolveSink(): SentryLike | null {
  if (typeof window === "undefined") return null;
  const candidate = (window as unknown as { Sentry?: SentryLike }).Sentry;
  if (
    candidate &&
    typeof candidate.captureException === "function" &&
    typeof candidate.captureMessage === "function"
  ) {
    return candidate;
  }
  return null;
}

export const telemetry = {
  capture(error: unknown, context?: Context): void {
    const sink = resolveSink();
    if (sink) {
      sink.captureException(error, context ? { extra: context } : undefined);
      return;
    }
    const message = error instanceof Error ? error.message : String(error);
    logger.error(message, { ...context, stack: toStack(error) });
  },
  message(message: string, context?: Context): void {
    const sink = resolveSink();
    if (sink) {
      sink.captureMessage(message, context ? { extra: context } : undefined);
      return;
    }
    logger.warn(message, context);
  },
};

function toStack(error: unknown): string | undefined {
  if (error instanceof Error) return error.stack;
  return undefined;
}
