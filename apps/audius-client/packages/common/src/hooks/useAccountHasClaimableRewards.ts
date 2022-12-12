import { ChallengeRewardID } from '../models'
import { getOptimisticUserChallenges } from '../store/challenges/selectors'

import { useProxySelector } from './useProxySelector'

const validRewardIds: Set<ChallengeRewardID> = new Set([
  'track-upload',
  'referrals',
  'ref-v',
  'mobile-install',
  'connect-verified',
  'listen-streak',
  'profile-completion',
  'referred',
  'send-first-tip',
  'first-playlist'
])

/** Pulls rewards from remoteconfig */
const getActiveRewardIds = (challengeRewardsIds: string) => {
  if (challengeRewardsIds === null) return []
  const rewards = challengeRewardsIds.split(',') as ChallengeRewardID[]
  const activeRewards = rewards.filter((reward) => validRewardIds.has(reward))
  return activeRewards
}

export const useAccountHasClaimableRewards = (challengeRewardsIds: string) => {
  return useProxySelector(
    (state) => {
      const optimisticUserChallenges = getOptimisticUserChallenges(state)
      const activeRewardIds = getActiveRewardIds(challengeRewardsIds)
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
