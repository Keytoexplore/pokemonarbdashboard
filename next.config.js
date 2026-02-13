/** @type {import('next').NextConfig} */
const nextConfig = {
  // Note: API routes require server-side rendering
  // For static export, API routes won't work - deploy to Vercel/Netlify for full functionality
  output: process.env.NODE_ENV === 'production' && process.env.STATIC_EXPORT === 'true' ? 'export' : undefined,
  distDir: 'dist',
  env: {
    POKEPRICE_API_KEY: process.env.POKEPRICE_API_KEY,
  },
}

module.exports = nextConfig