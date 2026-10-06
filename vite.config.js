import { defineConfig } from 'vite'

export default defineConfig({
  base: './',
  server: {
    watch: {
      // Windows can lock videos while they are copied or previewed.
      // Keep watching the code without attaching watchers to large MP4 files.
      ignored: path => /\.mp4$/i.test(path) || /(^|[\\/])\.tools([\\/]|$)/.test(path),
    },
  },
})
