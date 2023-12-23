import type { LoggerService } from '../Logger'

export type AntiAbuseOracle = {
  wallet: string
  endpoint: string
}

export type AntiAbuseOracleSelectorService = {
  getSelectedService(): Promise<AntiAbuseOracle | null>
}

export type AntiAbuseOracleSelectorConfigInternal = {
  endpoints: string[]
  addresses: string[]
  logger: LoggerService
}

export type AntiAbuseOracleSelectorConfig =
  Partial<AntiAbuseOracleSelectorConfigInternal>
