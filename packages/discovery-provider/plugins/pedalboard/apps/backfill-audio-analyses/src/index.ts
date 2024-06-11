import { AudiusLibs } from "@audius/sdk";
import { Config, readConfig } from './config'
import { logger } from './logger'
import { App } from '@pedalboard/basekit'
import { backfill } from './backfill'
import { initAudiusLibs } from './libs'

export type SharedData = {
  config: Config;
  libs: AudiusLibs;
}

export const config = readConfig()

const main = async () => {
  const libs = await initAudiusLibs()
  const appData: SharedData = {
    config,
    libs
  }
  await new App<SharedData>({ appData })
    .task(backfill)
    .run()
}

main().catch(logger.error.bind(logger))
