import type { AudiusSdk as AudiusSdkType } from '@audius/sdk'
import { sdk } from '@audius/sdk'
import { SourceConfig } from './sources'

const sdkCache: Record<string, AudiusSdkType> = {}

export function getSdk(sourceConfig: SourceConfig) {
  const { ddexKey, ddexSecret, name, env } = sourceConfig
  if (!sdkCache[ddexKey]) {
    sdkCache[ddexKey] = sdk({
      apiKey: ddexKey,
      apiSecret: ddexSecret,
      appName: name,
      environment: env || 'staging',
    })
  }

  return sdkCache[ddexKey]
}
