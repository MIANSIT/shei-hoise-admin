import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    // Add all quality values you plan to use
    qualities: [75, 100],
  },
  // The payment-receipt email attaches public/logo_beta.png, read at runtime
  // with fs. Tell the bundler to ship it with the server functions that send mail.
  outputFileTracingIncludes: {
    "/dashboard/subscription/invoices": ["./public/logo_beta.png"],
    "/dashboard/subscription/invoices/[id]": ["./public/logo_beta.png"],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '5mb', // set to 5mb (or higher if needed)
    },
  },
};

export default nextConfig;
