import type { Env } from '@audius/common'
import Config from 'react-native-config'

import { env as envDev } from './env.dev'
import { env as envProd } from './env.prod'
import { env as envStage } from './env.stage'

const environment = Config.ENVIRONMENT

let env: Env

switch (environment) {
  case 'development':
    env = envDev
    break
  case 'production':
    env = envProd
    break
  case 'staging':
    env = envStage
    break
  default:
    throw new Error(`Unknown environment: ${environment}`)
}

export { env }