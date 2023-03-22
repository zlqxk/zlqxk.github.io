const path = require('path')

/** @type {import('next').NextConfig} */
module.exports = {
  reactStrictMode: true,
  webpack: (config) => {
    config.module.rules.push({
      test: /\.md$/,
      use: [
        {
          loader: 'raw-loader',
        },
      ],
    })

    config.resolve.alias = {
      ...config.resolve.alias,
      '@src': path.resolve(__dirname, 'src'),
    }

    return config
  },
}
