import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  exclude: ["./src/saros-sdk-clone/**"],
  /* config options here */
};

export default nextConfig;
