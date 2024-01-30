import { PhantomProvider } from '@audius/common'
import { Chain } from '@audius/common/models'

export type PhantomWalletConnection = {
  chain: Chain.Sol
  provider: PhantomProvider
}
export type EthWalletConnection = { chain: Chain.Eth; provider: any }

export type WalletConnection = PhantomWalletConnection | EthWalletConnection
