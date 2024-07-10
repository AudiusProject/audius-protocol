import { Config, readConfig } from './config'
import { logger } from './logger'
import { App } from '@pedalboard/basekit'
import { backfillDiscovery } from './backfill_discovery'

export type SharedData = {
  config: Config
}

export const config = readConfig()

const main = async () => {
  await new App<SharedData>({}).task(backfillDiscovery).run()
  process.exit(0)
}

main().catch(logger.error.bind(logger))
