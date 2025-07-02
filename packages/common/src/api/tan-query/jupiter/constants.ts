import { TOKEN_LISTING_MAP } from '~/store/ui/buy-audio/constants'

import { UserBankManagedTokenInfo } from './types'

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
  [TOKEN_LISTING_MAP.TRUMP.address.toUpperCase()]: {
    mintAddress: TOKEN_LISTING_MAP.TRUMP.address,
    claimableTokenMint: 'TRUMP',
    decimals: TOKEN_LISTING_MAP.TRUMP.decimals
  }
}
