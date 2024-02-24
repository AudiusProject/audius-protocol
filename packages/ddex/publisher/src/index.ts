import dotenv from 'dotenv'
import path from 'path'
import { createSdkService } from './services/sdkService'

// Load env vars from ddex package root
dotenv.config({ path: path.join(__dirname, '..', '..', '.env') })

import { dialDb } from './services/dbService'
import { publishReleases } from './services/publisherService'
import createS3 from './services/s3Service'
;(async () => {
  try {
    const dbUrl =
      process.env.DDEX_MONGODB_URL ||
      'mongodb://mongo:mongo@localhost:27017/ddex?authSource=admin&replicaSet=rs0'
    await dialDb(dbUrl)
    const sdkService = await createSdkService()
    const s3 = createS3()

    publishReleases(sdkService.getSdk(), s3)
  } catch (error) {
    console.error('Failed to initialize:', error)
    process.exit(1)
  }
})()
