import { ID } from 'models/common/Identifiers'
import { getAccountUser } from 'store/account/selectors'
import { getUser } from 'store/cache/users/selectors'
import { AppState } from 'store/types'
import {
  BNAudio,
  StringAudio,
  stringAudioToBN,
  StringWei,
  stringWeiToAudioBN
} from 'store/wallet/slice'
import BN from 'bn.js'
import { createSelector } from 'reselect'

export type BadgeTier = 'none' | 'bronze' | 'silver' | 'gold' | 'platinum'

export const badgeTiers: { tier: BadgeTier; minAudio: BNAudio }[] = [
  {
    tier: 'platinum',
    minAudio: stringAudioToBN('100000' as StringAudio)
  },
  {
    tier: 'gold',
    minAudio: stringAudioToBN('10000' as StringAudio)
  },
  {
    tier: 'silver',
    minAudio: stringAudioToBN('100' as StringAudio)
  },
  {
    tier: 'bronze',
    minAudio: stringAudioToBN('10' as StringAudio)
  },
  {
    tier: 'none',
    minAudio: stringAudioToBN('0' as StringAudio)
  }
]

// Selectors

export const getVerifiedForUser = (
  state: AppState,
  { userId }: { userId: ID }
) => {
  const user = getUser(state, { id: userId })
  return !!user?.is_verified
}

export const getWeiBalanceForUser = (
  state: AppState,
  { userId }: { userId: ID }
) => {
  const accountUser = getAccountUser(state)
  const user = getUser(state, { id: userId })

  const wei: StringWei = (() => {
    if (accountUser?.user_id === userId) {
      return state.wallet.totalBalance ?? ('0' as StringWei)
    }
    const userOwnerWalletBalance = user?.balance ?? ('0' as StringWei)
    const userAssociatedWalletBalance =
      user?.associated_wallets_balance ?? ('0' as StringWei)
    const total = new BN(userOwnerWalletBalance).add(
      new BN(userAssociatedWalletBalance)
    )
    return total.toString() as StringWei
  })()

  return wei
}

/** Gets tier number, highest tier being badgeTiers.length, lowest being 1  */
export const getTierNumber = (tier: BadgeTier) =>
  badgeTiers.length - badgeTiers.findIndex(t => t.tier === tier)

export const makeGetTierAndVerifiedForUser = () =>
  createSelector(
    [getWeiBalanceForUser, getVerifiedForUser],
    (
      wei,
      isVerified
    ): { tier: BadgeTier; isVerified: boolean; tierNumber: number } => {
      const audio = stringWeiToAudioBN(wei)

      const index = badgeTiers.findIndex(t => {
        return t.minAudio.lte(audio)
      })

      const tier = index === -1 ? 'none' : badgeTiers[index].tier
      const tierNumber = index === -1 ? 0 : 4 - index

      return { tier, isVerified, tierNumber }
    }
  )
