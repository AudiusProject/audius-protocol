import { developmentConfig, productionConfig, stagingConfig } from './config'
import { sdk } from './sdk'
import { DiscoveryNodeSelector } from './services'
import { ParseRequestError } from './utils/parseParams'
import { Genre } from './types/Genre'
import { Mood } from './types/Mood'
;(window as any).audiusSdk = sdk
;(window as any).audiusSdk.DiscoveryNodeSelector = DiscoveryNodeSelector
;(window as any).audiusSdk.config = {
  staging: stagingConfig,
  production: productionConfig,
  development: developmentConfig
}
;(window as any).audiusSdk.ParseRequestError = ParseRequestError
;(window as any).audiusSdk.Genre = Genre
;(window as any).audiusSdk.Mood = Mood
