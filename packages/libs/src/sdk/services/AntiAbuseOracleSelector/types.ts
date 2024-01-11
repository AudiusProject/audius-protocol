import { Middleware } from '../../api/generated/default'
import type { LoggerService } from '../Logger'

export type AntiAbuseOracleNode = {
  /** The wallet address of the Anti Abuse Oracle. */
  wallet: string
  /** The URL of the Anti Abuse Oracle. */
  endpoint: string
}

/**
 * Service used to choose an Anti Abuse Oracle service.
 */
export type AntiAbuseOracleSelectorService = {
  /**
   * Returns a middleware that prepends the Anti Abuse Oracle endpoint to each
   * request and can reselect on certain responses or errors.
   */
  createMiddleware: () => Middleware
  /**
   * Gets a registered, healthy Anti Abuse Oracle endpoint and wallet.
   */
  getSelectedService(): Promise<AntiAbuseOracleNode>
}

/**
 * Note that for Anti Abuse Oracle, the wallet is the only information stored
 * on-chain. The URL endpoint is off-chain information. Thus, this configuration
 * must be complete as opposed to the "bootstrap" nodes of Discovery or Storage,
 * which are only used in initial selection.
 */
export type AntiAbuseOracleSelectorConfigInternal = {
  /** All possible endpoints for Anti Abuse Oracles. */
  endpoints: string[]
  /** All registered wallet addresses of Anti Abuse Oracles. */
  registeredAddresses: string[]
  /** The logging service. */
  logger: LoggerService
}

export type AntiAbuseOracleSelectorConfig =
  Partial<AntiAbuseOracleSelectorConfigInternal>
