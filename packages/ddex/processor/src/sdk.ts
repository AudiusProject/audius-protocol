import type { AudiusSdk as AudiusSdkType } from '@audius/sdk'
import { sdk } from '@audius/sdk'

const sdkCache: Record<string, AudiusSdkType> = {}

export function getSdk(
  ddexKey: string,
  ddexSecret: string,
  env?: 'production' | 'staging' | 'development'
) {
  if (!sdkCache[ddexKey]) {
    sdkCache[ddexKey] = sdk({
      apiKey: ddexKey,
      apiSecret: ddexSecret,
      appName: 'DDEX Publisher',
      environment: env,
    })
  }

  return sdkCache[ddexKey]
}
