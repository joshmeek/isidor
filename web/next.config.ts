import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  metadataBase: new URL('https://isidor.onrender.com'),
  trailingSlash: true,
  images: {
    unoptimized: true,
  }
};

export default nextConfig;