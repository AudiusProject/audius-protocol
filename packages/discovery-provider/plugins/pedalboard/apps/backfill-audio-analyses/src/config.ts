import dotenv from 'dotenv'
import { logger } from './logger'
import { bool, cleanEnv, num, str } from 'envalid'

export type Config = {
  environment: string
  url: string
  audiusDelegatePrivateKey: string
  rpcEndpoint: string
  rpcEndpointFallback: string
  acdcChainId?: string
  discoveryDbConnectionString: string
  entityManagerContractAddress: string
  entityManagerContractRegistryKey: string
  finalPoaBlock: number
  redisUrl: string,
  verifierAddress: string
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
    audius_delegate_private_key: str({ default: '' }),
    audius_contracts_entity_manager_address: str({
      default: '0x254dffcd3277C0b1660F6d42EFbB754edaBAbC2B'
    }),
    audius_web3_localhost: str({
      default: 'http://audius-protocol-poa-ganache-1:8545'
    }),
    audius_web3_host: str({
      default: 'http://audius-protocol-poa-ganache-1:8545'
    }),
    audius_db_url: str({
      default:
        'postgresql+psycopg2://postgres:postgres@db:5432/discovery_provider_1'
    }),
    audius_final_poa_block: num({ default: 0 }),
    audius_redis_url: str({
      default: 'redis://audius-protocol-discovery-provider-redis-1:6379/00'
    }),
    audius_contracts_verified_address: str({ default: '' })
  })
  return {
    environment: env.audius_discprov_env,
    url: env.audius_discprov_url,
    audiusDelegatePrivateKey: env.audius_delegate_private_key,
    rpcEndpoint: env.audius_web3_localhost,
    rpcEndpointFallback: env.audius_web3_host,
    discoveryDbConnectionString: env.audius_db_url,
    entityManagerContractAddress: env.audius_contracts_entity_manager_address,
    entityManagerContractRegistryKey: 'EntityManager',
    finalPoaBlock: env.audius_final_poa_block,
    redisUrl: env.audius_redis_url,
    verifierAddress: env.audius_contracts_verified_address
  }
}
