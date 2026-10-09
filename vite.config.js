import { defineConfig } from 'vite'

export default defineConfig({
  base: './',
  server: {
    watch: {
      // Polling avoids Windows file locks while still detecting new video files.
      usePolling: true,
      interval: 300,
      binaryInterval: 1000,
      ignored: path => /(^|[\\/])(\.tools|release)([\\/]|$)/.test(path),
    },
  },
})
