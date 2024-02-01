import { createSelector } from 'reselect'

import { getAccountUser } from '~/store/account/selectors'
import { getUser } from '~/store/cache/users/selectors'
import { CommonState } from '~/store/commonStore'
import { stringAudioToBN, stringWeiToAudioBN } from '~/utils/wallet'

import { BadgeTier } from '../../models/BadgeTier'
import { ID } from '../../models/Identifiers'
import { User } from '../../models/User'
import { BNAudio, StringAudio, StringWei } from '../../models/Wallet'

export type BadgeTierInfo = {
  tier: BadgeTier
  minAudio: BNAudio
  humanReadableAmount: number
}

export const badgeTiers: BadgeTierInfo[] = [
  {
    tier: 'platinum',
    minAudio: stringAudioToBN('100000' as StringAudio),
    humanReadableAmount: 100000
  },
  {
    tier: 'gold',
    minAudio: stringAudioToBN('10000' as StringAudio),
    humanReadableAmount: 10000
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

// Selectors

export const getVerifiedForUser = (
  state: CommonState,
  { userId }: { userId: ID }
) => {
  const user = getUser(state, { id: userId })
  return !!user?.is_verified
}

export const getWeiBalanceForUser = (
  state: CommonState,
  { userId }: { userId: ID }
) => {
  const accountUser = getAccountUser(state)
  const user = getUser(state, { id: userId })

  if (accountUser?.user_id === userId && state.wallet.totalBalance) {
    return state.wallet.totalBalance
  }
  if (!user) return '0' as StringWei
  return getUserBalance(user)
}

export const makeGetTierAndVerifiedForUser = () =>
  createSelector(
    [getWeiBalanceForUser, getVerifiedForUser],
    (
      wei,
      isVerified
    ): { tier: BadgeTier; isVerified: boolean; tierNumber: number } => {
      const { tier, tierNumber } = getTierAndNumberForBalance(wei)
      return { tier, isVerified, tierNumber }
    }
  )

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

export const getUserBalance = (user: User) =>
  user?.total_balance ?? ('0' as StringWei)
export const getTierForUser = (user: User) => {
  const balance = getUserBalance(user)
  return getTierAndNumberForBalance(balance).tier
}
