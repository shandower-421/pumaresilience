import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { viteSingleFile } from 'vite-plugin-singlefile'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import path from 'path'

function inlineAssetsPlugin(): Plugin {
  return {
    name: 'inline-assets',
    transformIndexHtml: {
      order: 'post',
      handler(html) {
        // Inline favicon as base64 data URI
        try {
          const faviconPath = resolve(__dirname, 'public/favicon.svg')
          const faviconData = readFileSync(faviconPath, 'base64')
          html = html.replace(
            /href="[^"]*favicon\.svg"/,
            `href="data:image/svg+xml;base64,${faviconData}"`
          )
        } catch (e) {
          console.warn('Warning: Could not inline favicon:', e)
        }

        // Inline icons.svg as base64 data URI
        try {
          const iconsPath = resolve(__dirname, 'public/icons.svg')
          const iconsData = readFileSync(iconsPath, 'base64')
          html = html.replace(
            /href="[^"]*icons\.svg"/g,
            `href="data:image/svg+xml;base64,${iconsData}"`
          )
        } catch {
          // icons.svg may not be referenced in HTML — that's fine
        }

        return html
      },
    },
  }
}

export default defineConfig(({ mode }) => {
  const isStandalone = mode === 'standalone' || mode === 'demo'
  const isDemo = mode === 'demo'

  return {
    base: isStandalone ? './' : '/',
    plugins: [
      react(),
      tailwindcss(),
      ...(isStandalone ? [viteSingleFile(), inlineAssetsPlugin()] : []),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    build: {
      ...(isStandalone && {
        assetsInlineLimit: 100_000_000,
        cssCodeSplit: false,
      }),
      outDir: isDemo ? 'dist-demo' : isStandalone ? 'dist-standalone' : 'dist',
    },
    define: {
      __DEMO_MODE__: JSON.stringify(isDemo),
      __STANDALONE_MODE__: JSON.stringify(isStandalone),
    },
  }
})
