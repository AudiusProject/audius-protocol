import type { AudiusWalletClient } from '../../../AudiusWalletClient'
import type { EthereumContractConfigInternal } from '../types'

export type AudiusTokenConfig = AudiusTokenConfigInternal & {
  walletClient: AudiusWalletClient
}

export type AudiusTokenConfigInternal = EthereumContractConfigInternal
