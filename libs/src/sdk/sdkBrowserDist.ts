import { ParseRequestError } from '../legacy'
import { developmentConfig, productionConfig, stagingConfig } from './config'
import { sdk } from './sdk'
import { DiscoveryNodeSelector } from './services'
;(window as any).audiusSdk = sdk
;(window as any).audiusSdk.DiscoveryNodeSelector = DiscoveryNodeSelector
;(window as any).audiusSdk.config = {
  staging: stagingConfig,
  production: productionConfig,
  development: developmentConfig
}
;(window as any).audiusSdk.ParseRequestError = ParseRequestError
