/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable standalone output for Docker
  output: 'standalone',
  eslint: {
    // Only run ESLint on these directories during production builds
    dirs: ['src'],
    // Don't fail build on ESLint errors (warnings are acceptable for Docker builds)
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Don't fail build on TypeScript errors during development
    ignoreBuildErrors: false,
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.output.globalObject = 'self';
    }
    return config;
  },
};

export default nextConfig;
