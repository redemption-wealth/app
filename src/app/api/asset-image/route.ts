// Same-origin proxy for asset images, used only when capturing the voucher card
// to an image (html-to-image). R2 signed URLs don't send an Access-Control-Allow-
// Origin header, so the browser can't read their pixels for the capture; fetching
// them through our own origin sidesteps that. SSRF-guarded to R2 hosts only.

const ALLOWED_HOST_SUFFIXES = [".r2.cloudflarestorage.com", ".r2.dev"];
const ALLOWED_HOSTS = ["cdn.wealthcrypto.fund"];

export async function GET(request: Request): Promise<Response> {
  const u = new URL(request.url).searchParams.get("u");
  if (!u) return new Response("Missing 'u'", { status: 400 });

  let target: URL;
  try {
    target = new URL(u);
  } catch {
    return new Response("Invalid url", { status: 400 });
  }

  const hostAllowed =
    ALLOWED_HOSTS.includes(target.hostname) ||
    ALLOWED_HOST_SUFFIXES.some((s) => target.hostname.endsWith(s));
  if (target.protocol !== "https:" || !hostAllowed) {
    return new Response("Forbidden host", { status: 403 });
  }

  let upstream: Response;
  try {
    upstream = await fetch(target.toString());
  } catch {
    return new Response("Upstream fetch failed", { status: 502 });
  }
  if (!upstream.ok) return new Response("Upstream error", { status: 502 });

  const body = await upstream.arrayBuffer();
  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": upstream.headers.get("content-type") ?? "image/png",
      "Cache-Control": "private, max-age=300",
    },
  });
}
