import { Keypair } from '@solana/web3.js'

export type SolanaWalletService = {
  getKeypair: () => Promise<Keypair | null>
}
