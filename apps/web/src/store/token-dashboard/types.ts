import { Chain, PhantomProvider } from '@audius/common'

export type PhantomWalletConnection = {
  chain: Chain.Sol
  provider: PhantomProvider
}
export type EthWalletConnection = { chain: Chain.Eth; provider: any }

export type WalletConnection = PhantomWalletConnection | EthWalletConnection
