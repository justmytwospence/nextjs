module.exports = {
  reactStrictMode: false,
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals.push('pathfinder');
    }
    return config;
  },
};
