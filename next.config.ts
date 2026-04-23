import type { NextConfig } from "next";

const privyDomains =
  "https://auth.privy.io https://*.privy.io wss://*.privy.io https://*.privy.systems";
const alchemyDomains =
  "https://*.g.alchemy.com https://*.alchemy.com wss://*.g.alchemy.com";
const ethereumRpcDomains =
  "https://cloudflare-eth.com https://rpc.ankr.com https://*.ankr.com";
const walletConnectDomains =
  "https://*.walletconnect.com https://*.walletconnect.org wss://*.walletconnect.com wss://*.walletconnect.org";
const cloudflareChallenge = "https://challenges.cloudflare.com";
const r2Domains =
  "https://*.r2.dev https://*.r2.cloudflarestorage.com https://pub-*.r2.dev";

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

const connectSrc = [
  "'self'",
  apiBaseUrl,
  privyDomains,
  alchemyDomains,
  ethereumRpcDomains,
  walletConnectDomains,
]
  .filter(Boolean)
  .join(" ");

const cspDirectives = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline' 'unsafe-eval' ${privyDomains} ${cloudflareChallenge}`,
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob: ${r2Domains} https:`,
  "font-src 'self' data:",
  `connect-src ${connectSrc}`,
  `frame-src 'self' ${privyDomains} ${cloudflareChallenge}`,
  "worker-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "*.r2.dev" },
      { protocol: "https", hostname: "*.r2.cloudflarestorage.com" },
    ],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Content-Security-Policy",
            value: cspDirectives.join("; "),
          },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
