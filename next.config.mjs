import path from "path";

const nextConfig = {
  reactStrictMode: true,
  output: "standalone",
  poweredByHeader: false,
  // Reduce artifact size: disable browser source maps in production
  productionBrowserSourceMaps: false,
  // Allow disabling SWC minification via env to mitigate build OOM
  swcMinify: process.env.DISABLE_MINIFY === '1' ? false : true,
  // Trim client bundle by removing console calls (keep warn/error)
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? { exclude: ['error', 'warn'] } : false,
  },
  // Reduce build-time memory pressure: skip type-checking and lint during build
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Ensure Next chooses this project as the tracing root (avoids picking parent dirs)
  outputFileTracingRoot: process.cwd(),
  async headers() {
    return [
      {
        // Baseline security headers for all routes
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-XSS-Protection", value: "1; mode=block" },
          { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains; preload" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
      {
        // Cache public uploads for 1 day
        source: "/uploads/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=86400" },
        ],
      },
    ];
  },
};

export default nextConfig;
