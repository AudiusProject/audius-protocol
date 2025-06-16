import { AUDIO, FixedDecimal, AudioWei } from '@audius/fixed-decimal'
import { PublicKey } from '@solana/web3.js'

import { useUser } from '~/api/tan-query/users/useUser'
import { Maybe, Nullable } from '~/utils'

import { BadgeTier } from '../../models/BadgeTier'
import { ID } from '../../models/Identifiers'
import { SolanaWalletAddress, StringWei } from '../../models/Wallet'

export type BadgeTierInfo = {
  tier: BadgeTier
  minAudio: FixedDecimal<AudioWei>
  humanReadableAmount: number
}

export const badgeTiers: BadgeTierInfo[] = [
  {
    tier: 'platinum',
    minAudio: AUDIO('10000'),
    humanReadableAmount: 10000
  },
  {
    tier: 'gold',
    minAudio: AUDIO('1000'),
    humanReadableAmount: 1000
  },
  {
    tier: 'silver',
    minAudio: AUDIO('100'),
    humanReadableAmount: 100
  },
  {
    tier: 'bronze',
    minAudio: AUDIO('10'),
    humanReadableAmount: 10
  },
  {
    tier: 'none',
    minAudio: AUDIO('0'),
    humanReadableAmount: 0
  }
]

/**
 * Hook to get the tier and verification status for a user
 * @param userId Optional user ID to check. If not provided, uses the current user
 * @returns Object containing tier, isVerified, and tierNumber
 */
export const useTierAndVerifiedForUser = (userId: Maybe<Nullable<ID>>) => {
  const { data: user } = useUser(userId, {
    select: (user) => ({
      total_balance: user.total_balance,
      is_verified: user.is_verified
    })
  })

  if (!user)
    return { tier: 'none' as BadgeTier, isVerified: false, tierNumber: 0 }

  const balance = user.total_balance ?? ('0' as StringWei)
  const { tier, tierNumber } = getTierAndNumberForBalance(AUDIO(balance))
  const isVerified = !!user.is_verified

  return { tier, isVerified, tierNumber }
}

/**
 * Get the tier and number for a given balance
 * @param balance - The balance to get the tier and number for
 * @returns The tier and number for the given balance
 */
export const getTierAndNumberForBalance = (balance: FixedDecimal<AudioWei>) => {
  const index = badgeTiers.findIndex((t) => {
    return t.minAudio.value <= balance.value
  })

  const tier = index === -1 ? 'none' : badgeTiers[index].tier
  const tierNumber = index === -1 ? 0 : 4 - index

  return { tier, tierNumber }
}

/**
 * Get the tier number for a given tier
 * @param tier - The tier to get the number for
 * @returns The tier number for the given tier
 */
export const getTierNumber = (tier: BadgeTier) =>
  badgeTiers.length - badgeTiers.findIndex((t) => t.tier === tier)

/**
 * Checks whether the input address is a valid solana address.
 */
export const isValidSolAddress = (address: SolanaWalletAddress) => {
  try {
    // @ts-ignore - need an unused variable to check if the destinationWallet is valid
    const ignored = new PublicKey(address)
    return true
  } catch (err) {
    console.debug(err)
    return false
  }
}
