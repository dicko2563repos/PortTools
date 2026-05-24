import path from "path";
import { operatorPortalFrameAncestorsHeader } from "@porttools/auth";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@porttools/ui"],
  outputFileTracingRoot: path.join(__dirname, "../.."),
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Content-Security-Policy",
            value: operatorPortalFrameAncestorsHeader(),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
