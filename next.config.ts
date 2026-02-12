import type { NextConfig } from "next";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  output: 'standalone',
  webpack(config) {
    const imageDir = path.resolve(__dirname, 'src/asset/image');
    config.module?.rules?.push({
      test: /\.(png|jpe?g|gif|svg|webp)$/i,
      include: imageDir,
      exclude: [
        path.resolve(imageDir, 'alipay.jpg'),
        path.resolve(imageDir, 'wechat.jpg'),
      ],
      use: 'ignore-loader',
    });
    return config;
  },
};

export default nextConfig;
