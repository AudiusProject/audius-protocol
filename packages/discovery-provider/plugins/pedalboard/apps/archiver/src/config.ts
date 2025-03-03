import { cleanEnv, str, num } from 'envalid'

export type Environment = 'dev' | 'stage' | 'prod'

export type Config = {
  environment: Environment
  cleanupOrphanedFilesIntervalSeconds: number
  orphanedJobsLifetimeSeconds: number
  concurrentJobs: number
  maxStemsArchiveAttempts: number
  discoveryNodeAllowlist: string[] | undefined
  discoveryDbConnectionString: string
  discoveryProviderUrl: string
  redisUrl: string
  serverHost: string
  serverPort: number
  archiverTmpDir: string
}

let config: Config | null = null

export const readConfig = (): Config => {
  if (config !== null) return config

  const env = cleanEnv(process.env, {
    audius_discprov_env: str<Environment>({
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
      default: 'redis://audius-protocol-discovery-provider-redis-1:6379/0'
    }),
    archiver_server_host: str({ default: '0.0.0.0' }),
    archiver_server_port: num({ default: 6003 }),
    archiver_concurrent_jobs: num({ default: 5 }),
    archiver_tmp_dir: str({ default: '/tmp/audius-archiver' }),
    archiver_cleanup_orphaned_files_interval_seconds: num({
      default: 10
    }),
    archiver_orphaned_jobs_lifetime_seconds: num({ default: 60 * 60 }),
    archiver_max_stems_archive_attempts: num({ default: 3 })
  })

  config = {
    environment: env.audius_discprov_env,
    concurrentJobs: env.archiver_concurrent_jobs,
    discoveryNodeAllowlist:
      process.env.archiver_discovery_node_allowlist?.split(',') ?? undefined,
    discoveryDbConnectionString: env.audius_db_url,
    discoveryProviderUrl: env.audius_discprov_url,
    redisUrl: env.audius_redis_url,
    serverHost: env.archiver_server_host,
    serverPort: env.archiver_server_port,
    archiverTmpDir: env.archiver_tmp_dir,
    cleanupOrphanedFilesIntervalSeconds:
      env.archiver_cleanup_orphaned_files_interval_seconds,
    orphanedJobsLifetimeSeconds: env.archiver_orphaned_jobs_lifetime_seconds,
    maxStemsArchiveAttempts: env.archiver_max_stems_archive_attempts
  }
  return config
}
