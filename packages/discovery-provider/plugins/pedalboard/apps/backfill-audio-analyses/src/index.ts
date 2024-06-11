import { Config, readConfig } from './config'
import { logger } from './logger'
import { App } from '@pedalboard/basekit'
import { backfillAudioAnalyses } from './backfill'

export type SharedData = {
  config: Config
}

export const config = readConfig()

const main = async () => {
  await new App<SharedData>({})
    .task(backfillAudioAnalyses)
    .run()
}

main().catch(logger.error.bind(logger))
