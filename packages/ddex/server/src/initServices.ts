import { createDbService } from './services/dbService'
import { createSdkService } from './services/sdkService'
import { createScheduledReleaseService } from './services/scheduledReleaseService'
import { createXmlProcessorService } from './services/xmlProcessorService'

export async function initServices() {
  const dbUrl =
    process.env.audius_db_url ||
    'postgres://postgres:postgres@localhost:5432/ddex'
  const sql = await createDbService(dbUrl)

  const audiusSdk = createSdkService()
  const xmlProcessorService = createXmlProcessorService(sql, audiusSdk)
  const scheduledReleaseService = createScheduledReleaseService(sql, audiusSdk)

  return {
    sql,
    audiusSdk,
    xmlProcessorService,
    scheduledReleaseService,
  }
}
