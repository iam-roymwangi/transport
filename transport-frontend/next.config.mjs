/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Silence Turbopack warning — xlsx is server-side only (API routes)
  turbopack: {},
}

export default nextConfig
