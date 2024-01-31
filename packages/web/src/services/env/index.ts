import { Environment, Env } from '@audius/common/services'

import type {} from '@audius/common'

import { env as envDev } from './env.dev'
import { env as envProd } from './env.prod'
import { env as envStage } from './env.stage'

const environment = process.env.VITE_ENVIRONMENT as Environment

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
