import { z } from 'zod'

import type { AuthService } from './services/Auth'
import type { DiscoveryNodeSelectorService } from './services/DiscoveryNodeSelector'
import type { EntityManagerService } from './services/EntityManager'
import type { LoggerService } from './services/Logger'
import type { StorageService } from './services/Storage'
import type { StorageNodeSelectorService } from './services/StorageNodeSelector'
import type { SolanaRelayService, SolanaWalletAdapter } from './services/Solana'
import type { ClaimableTokens } from './services/Solana/programs/ClaimableTokens/ClaimableTokens'
import type { AntiAbuseOracleSelectorService } from './services/AntiAbuseOracleSelector/types'

export type ServicesContainer = {
  /**
   * Service used to choose discovery node
   */
  discoveryNodeSelector: DiscoveryNodeSelectorService

  /**
   * Service used to choose storage node
   */
  storageNodeSelector: StorageNodeSelectorService

  /**
   * Service used to write and update entities on chain
   */
  entityManager: EntityManagerService

  /**
   * Service used to store and retrieve content e.g. tracks and images
   */
  storage: StorageService

  /**
   * Helpers to faciliate requests that require signatures or encryption
   */
  auth: AuthService

  /**
   * Service used to log and set a desired log level
   */
  logger: LoggerService

  /**
   * Service used to interact with the Solana relay
   */
  solanaRelay: SolanaRelayService

  /**
   * Service used to interact with the Solana blockchain
   */
  solanaWalletAdapter: SolanaWalletAdapter

  /**
   * Claimable Tokens Program client for Solana
   */
  claimableTokensProgram: ClaimableTokens

  /**
   * Service used to choose a healthy Anti Abuse Oracle
   */
  antiAbuseOracleSelector: AntiAbuseOracleSelectorService
}

const DevAppSchema = z.object({
  /**
   * Your app name
   */
  appName: z.optional(z.string()),
  /**
   * Services injection
   */
  services: z.optional(z.custom<Partial<ServicesContainer>>()),
  /**
   * API key, required for writes
   */
  apiKey: z.string().min(1),
  /**
   * API secret, required for writes
   */
  apiSecret: z.optional(z.string().min(1))
})

const CustomAppSchema = z.object({
  /**
   * Your app name
   */
  appName: z.string().min(1),
  /**
   * Services injection
   */
  services: z.optional(z.custom<Partial<ServicesContainer>>()),
  /**
   * API key, required for writes
   */
  apiKey: z.optional(z.string().min(1)),
  /**
   * API secret, required for writes
   */
  apiSecret: z.optional(z.string().min(1))
})

export const SdkConfigSchema = z.union([DevAppSchema, CustomAppSchema])

export type SdkConfig = z.infer<typeof SdkConfigSchema>
