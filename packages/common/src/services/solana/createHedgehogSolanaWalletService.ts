import { Keypair } from '@solana/web3.js'

import { HedgehogInstance } from '../auth/hedgehog'

import { SolanaWalletService } from './types'

export const createHedgehogSolanaWalletService = (
  hedghog: HedgehogInstance
): SolanaWalletService => {
  const getKeypair = () => {
    const hedgehogWallet = hedghog.getWallet()
    if (!hedgehogWallet) {
      return null
    }
    return Keypair.fromSeed(hedgehogWallet.getPrivateKey())
  }
  return { getKeypair }
}
