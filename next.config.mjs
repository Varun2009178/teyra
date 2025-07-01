/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "cdn.discordapp.com",
        port: "",
        pathname: "/**",
      },
    ],
  },
  // Optimize build performance
  poweredByHeader: false,
  reactStrictMode: true,
  swcMinify: true,
  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['framer-motion', 'date-fns']
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = [...config.externals, '@prisma/client', 'prisma']
    }
    return config
  },
};
 
export default nextConfig; 