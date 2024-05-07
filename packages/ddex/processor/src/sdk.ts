import type { AudiusSdk as AudiusSdkType } from '@audius/sdk'
import { sdk } from '@audius/sdk'

export const createSdkService = async () => {
  let sdkInstance: AudiusSdkType | null = null

  const ddexKey = process.env.DDEX_KEY
  const ddexSecret = process.env.DDEX_SECRET
  const envMap: Record<
    string,
    'production' | 'staging' | 'development' | undefined
  > = {
    production: 'production',
    staging: 'staging',
    development: 'development',
  } as const
  const env = envMap[process.env.NODE_ENV ?? 'production'] ?? 'production'
  if (ddexKey && ddexSecret) {
    try {
      sdkInstance = sdk({
        apiKey: ddexKey,
        apiSecret: ddexSecret,
        appName: 'DDEX Publisher',
        environment: env,
      })
      console.log(`SDK initialized for ${env}`)
    } catch (error) {
      console.error(`SDK failed to initialize for ${env}:`, error)
    }
  } else {
    console.log('DDEX keys not configured. Skipping SDK initialization')
  }

  const getSdk = () => {
    if (!sdkInstance) {
      throw new Error('SDK not initialized')
    }
    return sdkInstance as AudiusSdkType
  }

  return {
    getSdk,
  }
}
