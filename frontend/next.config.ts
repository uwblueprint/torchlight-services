import type { NextConfig } from "next";
import { PHASE_PRODUCTION_BUILD } from "next/constants";

const backendUrl = process.env.BACKEND_URL ?? "http://localhost:8000";

export default function config(phase: string): NextConfig {
  // Fixtures must never ship.
  if (phase === PHASE_PRODUCTION_BUILD && process.env.NEXT_PUBLIC_USE_MOCKS === "true") {
    throw new Error(
      "NEXT_PUBLIC_USE_MOCKS=true is not allowed in a production build. Unset it (check .env* files) and rebuild.",
    );
  }

  return {
    cacheComponents: true,
    partialPrefetching: true,
    experimental: {
      authInterrupts: true,
    },
    turbopack: {
      rules: {
        "*.css": {
          loaders: ["@tailwindcss/turbopack"],
          as: "*.css",
        },
      },
    },
    // Proxies browser calls so the backend needs no CORS.
    async rewrites() {
      return [{ source: "/api/v1/:path*", destination: `${backendUrl}/api/v1/:path*` }];
    },
  };
}
