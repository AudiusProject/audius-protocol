import { useCurrentAccount, useCurrentAccountUser } from '~/api'

import { ChallengeRewardID } from '../models'
import { getOptimisticUserChallenges } from '../store/challenges/selectors'

import { useProxySelector } from './useProxySelector'

/**
 * Hook to check if the current account has any claimable rewards for the given challenge reward IDs.
 */
export const useAccountHasClaimableRewards = (challengeRewardsIds: string) => {
  const { data: currentAccount } = useCurrentAccount()
  const { data: currentUser } = useCurrentAccountUser()

  return useProxySelector(
    (state) => {
      if (challengeRewardsIds === null || challengeRewardsIds === '')
        return false

      // Parse reward IDs within the selector for automatic memoization
      const activeRewardIds = challengeRewardsIds.split(
        ','
      ) as ChallengeRewardID[]
      if (activeRewardIds.length === 0) return false

      const optimisticUserChallenges = getOptimisticUserChallenges(
        state,
        currentAccount,
        currentUser
      )

      // Early return if no challenges exist
      if (
        !optimisticUserChallenges ||
        Object.keys(optimisticUserChallenges).length === 0
      ) {
        return false
      }

      // Check if any of the active challenges have claimable amounts
      return activeRewardIds.some((rewardId) => {
        const challenge = optimisticUserChallenges[rewardId]
        return challenge && challenge.claimableAmount > 0
      })
    },
    [challengeRewardsIds, currentAccount, currentUser]
  )
}
