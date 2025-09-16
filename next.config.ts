import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    // Add all quality values you plan to use
    qualities: [75, 100],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '5mb', // set to 5mb (or higher if needed)
    },
  },
};

export default nextConfig;
