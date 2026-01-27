import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 本番ビルド時のみ静的エクスポート（開発時は通常のSSRモード）
  ...(process.env.NODE_ENV === 'production' && {
    output: 'export',
    trailingSlash: true,
  }),
};

export default nextConfig;
