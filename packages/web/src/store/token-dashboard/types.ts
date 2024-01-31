import { Chain } from '@audius/common/models'
import { PhantomProvider } from '@audius/common/schemas'

export type PhantomWalletConnection = {
  chain: Chain.Sol
  provider: PhantomProvider
}
export type EthWalletConnection = { chain: Chain.Eth; provider: any }

export type WalletConnection = PhantomWalletConnection | EthWalletConnection
