import { ChallengeName, ChallengeRewardID } from '@audius/common/models'
import { StringKeys } from '@audius/common/services'

import { useRemoteVar } from 'hooks/useRemoteConfig'

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
  'first-playlist',
  ChallengeName.AudioMatchingSell, // $AUDIO matching seller
  ChallengeName.AudioMatchingBuy, // $AUDIO matching buyer
  ChallengeName.ConnectVerified,
  ChallengeName.FirstPlaylist,
  ChallengeName.FirstTip,
  ChallengeName.MobileInstall,
  ChallengeName.ProfileCompletion,
  ChallengeName.Referrals,
  ChallengeName.ReferralsVerified,
  ChallengeName.Referred,
  ChallengeName.TrackUpload,
  ChallengeName.OneShot
])

/** Pulls rewards from remoteconfig */
export function useRewardIds(
  hideConfig: Partial<Record<ChallengeRewardID, boolean>>
) {
  const rewardsString = useRemoteVar(StringKeys.CHALLENGE_REWARD_IDS)
  if (rewardsString === null) return []
  const rewards = rewardsString.split(',') as ChallengeRewardID[]
  const filteredRewards: ChallengeRewardID[] = rewards.filter(
    (reward) => validRewardIds.has(reward) && !hideConfig[reward]
  )
  return filteredRewards
}
