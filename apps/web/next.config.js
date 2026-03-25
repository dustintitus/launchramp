const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@launchramp/db', '@launchramp/api', '@launchramp/shared'],
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        '@launchramp/db': path.resolve(__dirname, '../../packages/db/src/index.ts'),
      };
    }
    return config;
  },
};

module.exports = nextConfig;
