import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // Tailwind output is small; inlining removes the render-blocking stylesheet request (faster LCP).
  experimental: { inlineCss: true },
  outputFileTracingIncludes: {
    "/opengraph-image": ["./assets/**"],
    "/b/[slug]/opengraph-image": ["./assets/**"],
    "/apple-icon": ["./app/icon.svg"],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
