import { defineConfig } from 'vite'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import vue from '@vitejs/plugin-vue'

const __dirname = dirname(fileURLToPath(import.meta.url))

// https://vite.dev/config/
export default defineConfig({
    plugins: [vue()],
    define: {
        "process.env.NODE_ENV": JSON.stringify(process.env.NODE_ENV),
    },
    build: {
       lib: {
          entry: resolve(__dirname, 'src/main.js'),
          fileName: 'jsonforms',
          formats: ['esm'],
        },
        outDir: "dist",
    }
})
