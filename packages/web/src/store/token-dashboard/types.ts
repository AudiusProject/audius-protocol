import { Chain } from '@audius/common/models/Chain'
import { PhantomProvider } from '@audius/common/services/audius-backend'

export type PhantomWalletConnection = {
  chain: Chain.Sol
  provider: PhantomProvider
}
export type EthWalletConnection = { chain: Chain.Eth; provider: any }

export type WalletConnection = PhantomWalletConnection | EthWalletConnection
