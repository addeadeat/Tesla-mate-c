import type { NextConfig } from "next";

const config: NextConfig = {
  // Repository instructions are maintained in the root AGENTS.md.
  agentRules: false,
  transpilePackages: ["@z/api-client"],
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "no-referrer" },
          { key: "X-Frame-Options", value: "DENY" },
        ],
      },
    ];
  },
};
export default config;
