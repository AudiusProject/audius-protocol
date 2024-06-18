import dotenv from 'dotenv'
import { logger } from './logger'
import { cleanEnv, str } from 'envalid'

export type Config = {
  environment: string
  url: string
  delegateOwnerWallet: string
  delegatePrivateKey: string
  redisUrl: string
  testRun: boolean
}

// reads .env file based on environment
const readDotEnv = () => {
  const environment = process.env.audius_discprov_env || 'dev'
  const dotenvConfig = (filename: string) =>
    dotenv.config({ path: `${filename}.env` })
  logger.info(`running on ${environment} network`)
  dotenvConfig(environment)
}

export const readConfig = (): Config => {
  readDotEnv()

  // validate env
  const env = cleanEnv(process.env, {
    audius_discprov_env: str({ default: 'dev' }),
    audius_discprov_url: str({ default: '' }),
    audius_delegate_owner_wallet: str({ default: '' }),
    audius_delegate_private_key: str({ default: '' }),
    audius_redis_url: str({
      default: 'redis://audius-protocol-discovery-provider-redis-1:6379/00'
    }),
    test_run: str({ default: 'false' })
  })
  return {
    environment: env.audius_discprov_env,
    url: env.audius_discprov_url,
    delegateOwnerWallet: env.audius_delegate_owner_wallet,
    delegatePrivateKey: env.audius_delegate_private_key,
    redisUrl: env.audius_redis_url,
    testRun: env.test_run === 'true'
  }
}
