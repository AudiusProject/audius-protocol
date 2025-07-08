import { PublicKey } from '@solana/web3.js'

import { Env } from '~/services/env'
import {
  createTokenListingMap,
  TOKEN_LISTING_MAP
} from '~/store/ui/shared/tokenConstants'

import { UserBankManagedTokenInfo } from './types'

export const JUPITER_PROGRAM_ID = new PublicKey(
  'JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4'
)

export const createUserBankManagedTokens = (
  env: Env
): Record<string, UserBankManagedTokenInfo> => {
  const tokenListingMap = createTokenListingMap(env)
  return {
    [tokenListingMap.AUDIO.address.toUpperCase()]: {
      mintAddress: tokenListingMap.AUDIO.address,
      claimableTokenMint: 'wAUDIO',
      decimals: tokenListingMap.AUDIO.decimals
    },
    [tokenListingMap.USDC.address.toUpperCase()]: {
      mintAddress: tokenListingMap.USDC.address,
      claimableTokenMint: 'USDC',
      decimals: tokenListingMap.USDC.decimals
    }
  }
}

export const USER_BANK_MANAGED_TOKENS: Record<
  string,
  UserBankManagedTokenInfo
> = {
  [TOKEN_LISTING_MAP.AUDIO.address.toUpperCase()]: {
    mintAddress: TOKEN_LISTING_MAP.AUDIO.address,
    claimableTokenMint: 'wAUDIO',
    decimals: TOKEN_LISTING_MAP.AUDIO.decimals
  },
  [TOKEN_LISTING_MAP.USDC.address.toUpperCase()]: {
    mintAddress: TOKEN_LISTING_MAP.USDC.address,
    claimableTokenMint: 'USDC',
    decimals: TOKEN_LISTING_MAP.USDC.decimals
  },
  [TOKEN_LISTING_MAP.BONK.address.toUpperCase()]: {
    mintAddress: TOKEN_LISTING_MAP.BONK.address,
    claimableTokenMint: 'BONK',
    decimals: TOKEN_LISTING_MAP.BONK.decimals
  }
}
