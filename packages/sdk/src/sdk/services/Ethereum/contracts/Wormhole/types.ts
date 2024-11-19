import type { AudiusWalletClient } from '../../../AudiusWalletClient'
import type { EthereumContractConfigInternal } from '../types'

export type WormholeConfig = {
  walletClient: AudiusWalletClient
} & WormholeConfigInternal

export type WormholeConfigInternal = EthereumContractConfigInternal
