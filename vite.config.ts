import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'

const MOCK_ENDPOINT = '/api/upload/chunk'
const MOCK_DELAY_MS = 120 // simulate network latency per chunk

function mockUploadEndpoint(): Plugin {
  return {
    name: 'mock-upload-endpoint',
    configureServer(server) {
      server.middlewares.use(MOCK_ENDPOINT, (req, res, next) => {
        if (req.method !== 'POST') return next()

        const uploadId = req.headers['x-upload-id'] ?? '?'
        const chunkIndex = Number(req.headers['x-chunk-index'] ?? -1)
        const totalChunks = Number(req.headers['x-total-chunks'] ?? -1)
        const filename = decodeURIComponent((req.headers['x-filename'] as string | undefined) ?? '?')

        // Drain body so the connection doesn't stall
        req.resume()
        req.on('end', () => {
          setTimeout(() => {
            const pct = Math.round(((chunkIndex + 1) / totalChunks) * 100)
            console.log(`[upload mock] ${filename} — chunk ${chunkIndex + 1}/${totalChunks} (${pct}%) upload:${uploadId}`)

            res.setHeader('Content-Type', 'application/json')
            res.statusCode = 200
            res.end(JSON.stringify({ ok: true, uploadId, chunkIndex }))
          }, MOCK_DELAY_MS)
        })
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), mockUploadEndpoint()],
})
