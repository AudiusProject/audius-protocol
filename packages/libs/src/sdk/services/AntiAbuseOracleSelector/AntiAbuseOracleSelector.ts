import { sampleSize } from 'lodash'
import { mergeConfigWithDefaults } from '../../utils/mergeConfigs'
import type { LoggerService } from '../Logger'
import { defaultAntiAbuseOracleSelectorConfig } from './constants'
import type {
  AntiAbuseOracleSelectorService,
  AntiAbuseOracle,
  AntiAbuseOracleSelectorConfig
} from './types'

export class AntiAbuseOracleSelector implements AntiAbuseOracleSelectorService {
  private services: AntiAbuseOracle[] | null = null
  private readonly logger: LoggerService
  private readonly endpoints: string[]
  private readonly addresses: string[]
  constructor(config?: AntiAbuseOracleSelectorConfig) {
    const configWithDefaults = mergeConfigWithDefaults(
      config,
      defaultAntiAbuseOracleSelectorConfig
    )
    this.endpoints = configWithDefaults.endpoints
    this.addresses = configWithDefaults.addresses
    this.logger = configWithDefaults.logger
  }

  public async getSelectedService() {
    const services = await this.getHealthyRegisteredServices()
    return sampleSize(services, 1)[0] ?? null
  }

  private async getHealthyRegisteredServices() {
    if (this.services === null) {
      this.services = []
      for (const endpoint of this.endpoints) {
        try {
          const response = await fetch(`${endpoint}/health_check`)
          if (response.ok) {
            const json = await response.json()
            const wallet = json.walletPubkey
            if (!this.addresses.includes(wallet)) {
              throw new Error(`Not registered: ${wallet}`)
            }
            this.services.push({
              endpoint,
              wallet
            })
          } else {
            throw new Error(`Response failed with status ${response.status}`)
          }
        } catch (e) {
          this.logger.warn(`Anti Abuse Oracle ${endpoint} is unhealthy: ${e}`)
        }
      }
    }
    return this.services
  }
}
