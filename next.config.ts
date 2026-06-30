import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    turbo: {
      rules: {
        "*.json": {
          loaders: ["json-loader"],
        },
      },
    },
  },
  images: {
    unoptimized: true,
  },
};

export default nextConfig;