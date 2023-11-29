import { ChallengeRewardID } from '../models'
import { getOptimisticUserChallenges } from '../store/challenges/selectors'

import { useProxySelector } from './useProxySelector'

export const useAccountHasClaimableRewards = (challengeRewardsIds: string) => {
  return useProxySelector(
    (state) => {
      if (challengeRewardsIds === null) return false
      const optimisticUserChallenges = getOptimisticUserChallenges(state)
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
