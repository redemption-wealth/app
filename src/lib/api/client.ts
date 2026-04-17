import type { ZodType } from "zod";
import { env } from "@/lib/env";
import { ApiError, throwIfNotOk } from "./errors";

type AccessTokenGetter = () => Promise<string | null>;

let accessTokenGetter: AccessTokenGetter | null = null;

export function registerAccessTokenGetter(getter: AccessTokenGetter): void {
  accessTokenGetter = getter;
}

function resolveBaseUrl(): string {
  return env.NEXT_PUBLIC_API_BASE_URL.replace(/\/$/, "");
}

export type QueryValue = string | number | boolean | null | undefined;
export type QueryParams = { readonly [key: string]: QueryValue };

export interface ApiRequestOptions<TResponse> {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  path: string;
  query?: QueryParams;
  body?: unknown;
  responseSchema: ZodType<TResponse>;
  requireAuth?: boolean;
  signal?: AbortSignal;
}

function buildUrl(path: string, query?: QueryParams): string {
  const base = resolveBaseUrl();
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const url = new URL(`${base}${normalizedPath}`);
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value === undefined || value === null) continue;
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

  const init: RequestInit = { method, headers };
  if (body !== undefined) init.body = JSON.stringify(body);
  if (signal) init.signal = signal;
  const res = await fetch(url, init);

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
