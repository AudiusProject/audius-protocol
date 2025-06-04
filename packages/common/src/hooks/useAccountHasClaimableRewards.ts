import { useCurrentAccount, useCurrentAccountUser } from '~/api'

import { ChallengeRewardID } from '../models'
import { getOptimisticUserChallenges } from '../store/challenges/selectors'

import { useProxySelector } from './useProxySelector'

export const useAccountHasClaimableRewards = (challengeRewardsIds: string) => {
  const { data: currentAccount } = useCurrentAccount()
  const { data: currentUser } = useCurrentAccountUser()

  return useProxySelector(
    (state) => {
      if (challengeRewardsIds === null) return false
      const optimisticUserChallenges = getOptimisticUserChallenges(
        state,
        currentAccount,
        currentUser
      )
      const activeRewardIds = challengeRewardsIds.split(
        ','
      ) as ChallengeRewardID[]
      const activeUserChallenges = Object.values(
        optimisticUserChallenges
      ).filter((challenge) => activeRewardIds.includes(challenge.challenge_id))

      return activeUserChallenges.some(
        (challenge) => challenge.claimableAmount > 0
      )
    },
    [challengeRewardsIds]
  )
}
