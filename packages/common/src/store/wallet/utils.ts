import { useSelector } from 'react-redux'

import { useCurrentAccountUser } from '~/api'
import { useUser } from '~/api/tan-query/users/useUser'
import { CommonState } from '~/store/commonStore'
import { stringAudioToBN, stringWeiToAudioBN } from '~/utils/wallet'

import { BadgeTier } from '../../models/BadgeTier'
import { ID } from '../../models/Identifiers'
import { User, UserMetadata } from '../../models/User'
import { BNAudio, StringAudio, StringWei } from '../../models/Wallet'

export type BadgeTierInfo = {
  tier: BadgeTier
  minAudio: BNAudio
  humanReadableAmount: number
}

export const badgeTiers: BadgeTierInfo[] = [
  {
    tier: 'platinum',
    minAudio: stringAudioToBN('10000' as StringAudio),
    humanReadableAmount: 10000
  },
  {
    tier: 'gold',
    minAudio: stringAudioToBN('1000' as StringAudio),
    humanReadableAmount: 1000
  },
  {
    tier: 'silver',
    minAudio: stringAudioToBN('100' as StringAudio),
    humanReadableAmount: 100
  },
  {
    tier: 'bronze',
    minAudio: stringAudioToBN('10' as StringAudio),
    humanReadableAmount: 10
  },
  {
    tier: 'none',
    minAudio: stringAudioToBN('0' as StringAudio),
    humanReadableAmount: 0
  }
]

/**
 * Hook to get the tier and verification status for a user
 * @param userId Optional user ID to check. If not provided, uses the current user
 * @returns Object containing tier, isVerified, and tierNumber
 */
export const useTierAndVerifiedForUser = (userId?: ID | null) => {
  const { data: currentUser } = useCurrentAccountUser()
  const { data: user } = useUser(userId)
  const currentUserBalance =
    useSelector((state: CommonState) => state.wallet.totalBalance) ??
    ('0' as StringWei)

  const targetUser = userId ? user : currentUser
  if (!targetUser)
    return { tier: 'none' as BadgeTier, isVerified: false, tierNumber: 0 }

  const balance = userId ? currentUserBalance : getUserBalance(targetUser)
  const { tier, tierNumber } = getTierAndNumberForBalance(balance)
  const isVerified = !!targetUser.is_verified

  return { tier, isVerified, tierNumber }
}

// Helpers

export const getTierAndNumberForBalance = (balance: StringWei) => {
  const audio = stringWeiToAudioBN(balance)

  const index = badgeTiers.findIndex((t) => {
    return t.minAudio.lte(audio)
  })

  const tier = index === -1 ? 'none' : badgeTiers[index].tier
  const tierNumber = index === -1 ? 0 : 4 - index

  return { tier, tierNumber }
}

/** Gets tier number, highest tier being badgeTiers.length, lowest being 1  */
export const getTierNumber = (tier: BadgeTier) =>
  badgeTiers.length - badgeTiers.findIndex((t) => t.tier === tier)

export const getUserBalance = (user: User | UserMetadata) =>
  user?.total_balance ?? ('0' as StringWei)

export const getTierForUser = (user: User) => {
  const balance = getUserBalance(user)
  return getTierAndNumberForBalance(balance).tier
}
