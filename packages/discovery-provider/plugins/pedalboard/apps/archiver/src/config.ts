import { cleanEnv, str, num } from 'envalid'

type Config = {
  environment: string
  discoveryDbConnectionString: string
  redisUrl: string
  serverHost: string
  serverPort: number
}

let config: Config | null = null

export const readConfig = (): Config => {
  if (config !== null) return config

  const env = cleanEnv(process.env, {
    audius_discprov_env: str({
      default: 'dev'
    }),
    audius_discprov_url: str({
      default: 'http://audius-protocol-discovery-provider-1'
    }),
    audius_db_url: str({
      default:
        'postgresql+psycopg2://postgres:postgres@db:5432/discovery_provider_1'
    }),
    audius_redis_url: str({
      default: 'redis://audius-protocol-discovery-provider-redis-1:6379/00'
    }),
    archiver_server_host: str({ default: '0.0.0.0' }),
    archiver_server_port: num({ default: 6003 })
  })

  config = {
    environment: env.audius_discprov_env,
    discoveryDbConnectionString: env.audius_db_url,
    redisUrl: env.audius_redis_url,
    serverHost: env.archiver_server_host,
    serverPort: env.archiver_server_port
  }
  return config
}
