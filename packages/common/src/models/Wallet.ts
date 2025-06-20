import { Brand } from '~/utils/typeUtils'

export type StringWei = Brand<string, 'stringWEI'>
export type StringAudio = string
export type StringUSDC = Brand<string, 'stringUSDC'>

export type WalletAddress = string
export type SolanaWalletAddress = Brand<string, 'solanaWallet'>

export type UserWallets = {
  wallets: string[]
  sol_wallets: string[]
}
