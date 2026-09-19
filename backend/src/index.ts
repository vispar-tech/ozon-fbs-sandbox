import { serve } from '@hono/node-server'
import { app } from './app.js'

const DEFAULT_PORT = 3000
const MIN_PORT = 1
const MAX_PORT = 65535

const rawPort = process.env.PORT ?? String(DEFAULT_PORT)
const PORT = Number(rawPort)
if (!Number.isInteger(PORT) || PORT < MIN_PORT || PORT > MAX_PORT) {
  throw new Error(`Invalid PORT "${rawPort}": expected an integer between ${MIN_PORT} and ${MAX_PORT}`)
}

serve({
  fetch: app.fetch,
  port: PORT
}, (info) => {
  // eslint-disable-next-line no-console -- server startup log
  console.log(`Server is running on http://localhost:${String(info.port)}`)
})