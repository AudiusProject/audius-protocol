import { PublicKey } from '@solana/web3.js'

import { MintName } from '~/services/audius-backend/solana'
import { Env } from '~/services/env'
import { getOrInitializeRegistry, type TokenConfig } from '~/services/tokens'

import { UserBankManagedTokenInfo } from './types'

const CLAIMABLE_TOKEN_MINTS = ['wAUDIO', 'USDC', 'BONK'] as const
type ClaimableTokenMint = (typeof CLAIMABLE_TOKEN_MINTS)[number]

const isClaimableTokenMint = (symbol: string): symbol is ClaimableTokenMint => {
  return CLAIMABLE_TOKEN_MINTS.includes(symbol as ClaimableTokenMint)
}

// Convert token symbol to proper mint name for useTokenBalance
// AUDIO -> wAUDIO, others remain the same
export const getTokenMintName = (symbol: string): MintName => {
  const mintName = symbol === 'AUDIO' ? 'wAUDIO' : symbol
  return mintName as MintName
}

export const JUPITER_PROGRAM_ID = new PublicKey(
  'JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4'
)

export const createUserBankManagedTokens = (
  env: Env
): Record<string, UserBankManagedTokenInfo> => {
  const registry = getOrInitializeRegistry(env.ENVIRONMENT)

  // Get all userbank-enabled tokens from registry
  const userbankTokens: TokenConfig[] = registry.getUserbankTokens()
  const managedTokens: Record<string, UserBankManagedTokenInfo> = {}

  // Convert registry tokens to UserBankManagedTokenInfo format
  userbankTokens.forEach((token: TokenConfig) => {
    if (isClaimableTokenMint(token.symbol)) {
      managedTokens[token.address.toUpperCase()] = {
        mintAddress: token.address,
        claimableTokenMint: token.symbol,
        decimals: token.decimals
      }
    }
  })

  return managedTokens
}
