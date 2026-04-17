export interface ApiErrorBody {
  error?: string;
  details?: unknown;
  [key: string]: unknown;
}

export class ApiError extends Error {
  readonly status: number;
  readonly endpoint: string;
  readonly body: ApiErrorBody | null;

  constructor(
    message: string,
    status: number,
    endpoint: string,
    body: ApiErrorBody | null,
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.endpoint = endpoint;
    this.body = body;
  }

  get isUnauthorized(): boolean {
    return this.status === 401;
  }

  get isNotFound(): boolean {
    return this.status === 404;
  }

  get isValidation(): boolean {
    return this.status === 400;
  }

  get isServerError(): boolean {
    return this.status >= 500;
  }
}

export async function throwIfNotOk(
  res: Response,
  endpoint: string,
): Promise<void> {
  if (res.ok) return;

  let body: ApiErrorBody | null = null;
  try {
    body = (await res.json()) as ApiErrorBody;
  } catch {
    body = null;
  }

  const message = body?.error ?? `${res.status} ${res.statusText}`;
  throw new ApiError(message, res.status, endpoint, body);
}
