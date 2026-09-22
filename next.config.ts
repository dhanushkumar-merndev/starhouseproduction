import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["192.168.1.9", "192.168.1.8"],
  devIndicators: false,
};

export default nextConfig;
