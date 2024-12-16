import { Keypair } from '@solana/web3.js'

import { HedgehogInstance } from '../auth/hedgehog'

import { SolanaWalletService } from './types'

export const createHedgehogSolanaWalletService = (
  hedgehog: HedgehogInstance
): SolanaWalletService => {
  const getKeypair = async () => {
    await hedgehog.waitUntilReady()
    const hedgehogWallet = hedgehog.getWallet()
    if (!hedgehogWallet) {
      return null
    }
    return Keypair.fromSeed(hedgehogWallet.getPrivateKey())
  }
  return { getKeypair }
}
