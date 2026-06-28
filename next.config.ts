import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
