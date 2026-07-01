import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/orchestrator",
        has: [{ type: "host", value: "cognitiveempire.com" }],
        destination: "https://orchestrator.cognitiveempire.com",
        permanent: false,
      },
      {
        source: "/orchestrator/:path*",
        has: [{ type: "host", value: "cognitiveempire.com" }],
        destination: "https://orchestrator.cognitiveempire.com/:path*",
        permanent: false,
      },
    ];
  },
  async rewrites() {
    return {
      beforeFiles: [
        {
          source: "/",
          destination: "/orchestrator",
          has: [{ type: "host", value: "orchestrator.cognitiveempire.com" }],
        },
        {
          source: "/:path*",
          destination: "/orchestrator/:path*",
          has: [{ type: "host", value: "orchestrator.cognitiveempire.com" }],
        },
      ],
    };
  },
};

export default nextConfig;
