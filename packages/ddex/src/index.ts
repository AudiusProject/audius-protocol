import dotenv from 'dotenv'
import path from 'path'

// Load env vars based on NODE_ENV
const envFile = process.env.NODE_ENV === 'stage' ? '.env.stage' : '.env'
dotenv.config({ path: path.resolve(process.cwd(), envFile) })

import createApp from './app'
import { initServices } from './initServices'
;(async () => {
  try {
    const { sql, audiusSdk, xmlProcessorService, scheduledReleaseService } =
      await initServices()

    const app = createApp(
      sql,
      audiusSdk,
      xmlProcessorService,
      scheduledReleaseService
    )

    const port = process.env.DDEX_PORT || 8926
    app.listen(port, () => {
      console.log(`[server]: Server is running at http://localhost:${port}`)
    })
  } catch (error) {
    console.error('Failed to initialize services:', error)
    process.exit(1)
  }
})()
