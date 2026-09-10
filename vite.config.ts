import { defineConfig } from 'vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    babel({ presets: [reactCompilerPreset()] })
  ],
  build: {
    rollupOptions: {
      output: {
        /**
         * Names the three libraries that never change between deploys, so a returning visitor
         * re-uses them instead of re-downloading the app's own code with them fused in. Before this
         * the entry chunk was a single 727 KB blob.
         *
         * **Everything else returns `undefined` on purpose.** Naming a chunk makes it *static*: an
         * earlier version of this function swept all of `node_modules` into one `vendor` chunk,
         * which pulled the lazily-imported Neon Auth SDK back into the entry graph and undid the
         * 365 KB saving it exists to produce. If a module is reached only through `import()`, let
         * rolldown give it its own chunk.
         */
        manualChunks(id) {
          if (!id.includes('node_modules')) {
            return undefined
          }

          if (/[\\/]node_modules[\\/](react|react-dom|scheduler)[\\/]/.test(id)) {
            return 'vendor-react'
          }

          if (id.includes('react-router')) {
            return 'vendor-router'
          }

          if (id.includes('i18next')) {
            return 'vendor-i18n'
          }

          return undefined
        },
      },
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
    },
  },
})
