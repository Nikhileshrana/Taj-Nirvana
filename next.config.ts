import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,

  /* config options here */
  reactCompiler: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'olxsxi4kqvqqjqqe.public.blob.vercel-storage.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
