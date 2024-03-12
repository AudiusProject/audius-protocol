import { Environment, Env } from '@audius/common/services'

import { env as envDev } from './env.dev'
import { env as envProd } from './env.prod'
import { env as envStage } from './env.stage'

const environment = process.env.VITE_ENVIRONMENT as Environment

export const getEnv = (): Env => {
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

export const env = getEnv
