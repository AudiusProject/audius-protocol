import sample from 'lodash/sample'
import { mergeConfigWithDefaults } from '../../utils/mergeConfigs'
import type { LoggerService } from '../Logger'
import { defaultAntiAbuseOracleSelectorConfig } from './constants'
import type {
  AntiAbuseOracleSelectorService,
  AntiAbuseOracle,
  AntiAbuseOracleSelectorConfig
} from './types'

export class AntiAbuseOracleSelector implements AntiAbuseOracleSelectorService {
  private readonly endpoints: string[]
  private readonly registeredAddresses: string[]
  private readonly logger: LoggerService
  private selectedNode: AntiAbuseOracle | null = null
  private services: AntiAbuseOracle[] | null = null

  constructor(config?: AntiAbuseOracleSelectorConfig) {
    const configWithDefaults = mergeConfigWithDefaults(
      config,
      defaultAntiAbuseOracleSelectorConfig
    )
    this.endpoints = configWithDefaults.endpoints
    this.registeredAddresses = configWithDefaults.registeredAddresses
    this.logger = configWithDefaults.logger
  }

  /**
   * Finds a healthy, registered Anti Abuse Oracle.
   */
  public async getSelectedService() {
    if (!this.selectedNode) {
      const services = await this.getServices()
      const service = sample(services)
      if (!service) {
        throw new Error('All Anti Abuse Oracles are unhealthy')
      }
      this.selectedNode = service
    }
    return this.selectedNode
  }

  private async getServices() {
    if (this.services === null) {
      this.services = []
      await Promise.all(
        this.endpoints.map(async (endpoint) => {
          try {
            const service = await this.checkHealth(endpoint)
            this.services?.push(service)
          } catch (e) {
            this.logger.warn(`Anti Abuse Oracle ${endpoint} is unhealthy: ${e}`)
          }
        })
      )
    }
    return this.services
  }

  private async checkHealth(endpoint: string) {
    const response = await fetch(`${endpoint}/health_check`)
    if (response.ok) {
      const json = await response.json()
      const wallet = json.walletPubkey
      if (!this.registeredAddresses.includes(wallet)) {
        throw new Error(`Not registered: ${wallet}`)
      }
      return { wallet, endpoint }
    } else {
      throw new Error(`Response failed with status ${response.status}`)
    }
  }
}
