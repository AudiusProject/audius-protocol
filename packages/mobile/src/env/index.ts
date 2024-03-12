import type { Env } from '@audius/common/services'
import Config from 'react-native-config'

import { env as envDev } from './env.dev'
import { env as envProd } from './env.prod'
import { env as envStage } from './env.stage'

const environment = Config.ENVIRONMENT

export const env = (): Env => {
  switch (environment) {
    case 'development':
      return envDev
    case 'production':
      return envProd
    case 'staging':
      return envStage
    default:
      throw new Error(`Unknown environment: ${environment}`)
  }
}
