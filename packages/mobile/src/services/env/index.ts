import type { Env } from '@audius/common/services'

import { env as envDev } from './env.dev'
import { env as envProd } from './env.prod'
import { env as envStage } from './env.stage'

const environment = 'production' // Config.ENVIRONMENT

let env: Env

switch (environment) {
  // @ts-ignore
  case 'development':
    env = envDev
    break
  // @ts-ignore
  case 'production':
    env = envProd
    break
  // @ts-ignore
  case 'staging':
    env = envStage
    break
  default:
    throw new Error(`Unknown environment: ${environment}`)
}

export { env }
