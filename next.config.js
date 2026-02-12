module.exports = {
  reactStrictMode: true,
  images: {
    domains: ['shop.japan-toreca.com', 'torecacamp-pokemon.com'],
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api',
  },
};