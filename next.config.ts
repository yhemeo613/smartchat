import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  serverExternalPackages: ['pdf-parse', 'pg', 'word-extractor', 'mammoth', 'jszip'],
};

export default nextConfig;
