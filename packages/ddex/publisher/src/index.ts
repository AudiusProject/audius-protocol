import dotenv from 'dotenv'
import path from 'path'

// Load env vars based on NODE_ENV
const envFile = process.env.NODE_ENV === 'stage' ? '.env.stage' : '.env'
dotenv.config({ path: path.resolve(process.cwd(), envFile) })

import createApp from './app'
import { dialDb } from './services/dbService'

const port = process.env.DDEX_PORT || 9001

;(async () => {
  try {
    const dbUrl =
      process.env.DDEX_MONGODB_URL ||
      'mongodb://mongo:mongo@localhost:27017/ddex?authSource=admin'
    await dialDb(dbUrl)

    const app = createApp()

    app.listen(port, () => {
      console.log(`[server]: Server is running at http://localhost:${port}`)
    })
  } catch (error) {
    console.error('Failed to initialize:', error)
    process.exit(1)
  }
})()
