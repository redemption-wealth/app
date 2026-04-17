import type { ZodType } from "zod";
import { ApiError, throwIfNotOk } from "./errors";

type AccessTokenGetter = () => Promise<string | null>;

let accessTokenGetter: AccessTokenGetter | null = null;

export function registerAccessTokenGetter(getter: AccessTokenGetter): void {
  accessTokenGetter = getter;
}

function resolveBaseUrl(): string {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!base) {
    throw new Error("NEXT_PUBLIC_API_BASE_URL is not configured");
  }
  return base.replace(/\/$/, "");
}

export interface ApiRequestOptions<TResponse> {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  path: string;
  query?: Record<string, string | number | boolean | undefined>;
  body?: unknown;
  responseSchema: ZodType<TResponse>;
  requireAuth?: boolean;
  signal?: AbortSignal;
}

function buildUrl(path: string, query?: ApiRequestOptions<unknown>["query"]): string {
  const base = resolveBaseUrl();
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const url = new URL(`${base}${normalizedPath}`);
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value === undefined) continue;
      url.searchParams.set(key, String(value));
    }
  }
  return url.toString();
}

export async function apiRequest<TResponse>(
  options: ApiRequestOptions<TResponse>,
): Promise<TResponse> {
  const {
    method = "GET",
    path,
    query,
    body,
    responseSchema,
    requireAuth = false,
    signal,
  } = options;

  const url = buildUrl(path, query);
  const headers: Record<string, string> = { Accept: "application/json" };

  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  if (requireAuth) {
    if (!accessTokenGetter) {
      throw new ApiError(
        "Access token getter is not registered",
        0,
        path,
        null,
      );
    }
    const token = await accessTokenGetter();
    if (!token) {
      throw new ApiError("User is not authenticated", 401, path, null);
    }
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(url, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
    signal,
  });

  await throwIfNotOk(res, path);

  const json = (await res.json()) as unknown;
  const parsed = responseSchema.safeParse(json);

  if (!parsed.success) {
    throw new ApiError(
      "Response did not match expected schema",
      res.status,
      path,
      { error: "schema_mismatch", details: parsed.error.flatten() },
    );
  }

  return parsed.data;
}
