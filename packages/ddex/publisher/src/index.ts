import dotenv from 'dotenv'
import path from 'path'

// Load env vars from ddex package root
dotenv.config({ path: path.join(__dirname, '..', '..', '.env') })

import createApp from './app'
import { dialDb } from './services/dbService'
import { publishReleases } from './services/publisherService'

const port = process.env.DDEX_PORT || 9001

;(async () => {
  try {
    const dbUrl =
      process.env.DDEX_MONGODB_URL ||
      'mongodb://mongo:mongo@localhost:27017/ddex?authSource=admin&replicaSet=rs0'
    await dialDb(dbUrl)

    const app = createApp()

    publishReleases()

    app.listen(port, () => {
      console.log(`[server]: Server is running at http://localhost:${port}`)
    })
  } catch (error) {
    console.error('Failed to initialize:', error)
    process.exit(1)
  }
})()
