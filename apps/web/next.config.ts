import type { NextConfig } from 'next'
import path from 'node:path'

const config: NextConfig = {
  transpilePackages: ['@ceevee/types'],
  turbopack: {
    root: path.resolve(__dirname, '../..'),
  },
}

export default config
