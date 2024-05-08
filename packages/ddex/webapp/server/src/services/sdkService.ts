import type { AudiusSdk } from '@audius/sdk'
import { sdk } from '@audius/sdk'

const createSdkService = async (): Promise<AudiusSdk> => {
  const ddexKey = process.env.DDEX_KEY
  const ddexSecret = process.env.DDEX_SECRET
  const envMap: Record<
    string,
    'production' | 'staging' | 'development' | undefined
  > = {
    production: 'production',
    staging: 'staging',
    development: 'development'
  } as const
  const env = envMap[process.env.NODE_ENV ?? 'production'] ?? 'production'
  if (!ddexKey || !ddexSecret) {
    throw new Error('DDEX keys not configured. Unable to initialize SDK')
  }

  try {
    const sdkInstance = sdk({
      apiKey: ddexKey,
      apiSecret: ddexSecret,
      appName: 'DDEX Demo',
      environment: env
    })
    console.info(`SDK initialized for ${env}`)
    return sdkInstance
  } catch (error) {
    throw new Error(`SDK failed to initialize for ${env}: ${error}`)
  }
}

export default createSdkService
