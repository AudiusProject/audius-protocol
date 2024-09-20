import { AudiusLibs } from '@audius/sdk/dist/libs'
import dotenv from 'dotenv'
import { initAudiusLibs } from './libs'
import { Ok, Result } from 'ts-results'

export type SharedData = {
  libs: AudiusLibs
  dryRun: boolean
}

export const initSharedData = async (): Promise<Result<SharedData, string>> => {
  dotenv.config({ path: './.env' })

  const libs = await initAudiusLibs()
  const dryRun = process.env.dryRun === 'true'
  console.log(`Dry run: ${dryRun}`)

  // @ts-ignore
  return new Ok({
    libs,
    dryRun
  })
}
