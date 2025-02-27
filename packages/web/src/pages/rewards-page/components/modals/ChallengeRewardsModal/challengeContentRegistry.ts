import { ChallengeName } from '@audius/common/models'

import { AudioMatchingRewardsModalContent } from './AudioMatchingRewardsModalContent'
import { DefaultChallengeContent } from './DefaultChallengeContent'
import { FirstWeeklyCommentChallengeModalContent } from './FirstWeeklyCommentChallengeModalContent'
import { ListenStreakChallengeModalContent } from './ListenStreakChallengeModalContent'
import { OneShotChallengeModalContent } from './OneShotChallengeModalContent'
import { ReferralsChallengeModalContent } from './ReferralsChallengeModalContent'
import {
  type ChallengeContentMap,
  type ChallengeContentComponent
} from './types'

export const challengeContentRegistry: ChallengeContentMap = {
  [ChallengeName.AudioMatchingBuy]:
    AudioMatchingRewardsModalContent as ChallengeContentComponent,
  [ChallengeName.AudioMatchingSell]:
    AudioMatchingRewardsModalContent as ChallengeContentComponent,
  [ChallengeName.ListenStreakEndless]:
    ListenStreakChallengeModalContent as ChallengeContentComponent,
  [ChallengeName.OneShot]:
    OneShotChallengeModalContent as ChallengeContentComponent,
  [ChallengeName.FirstWeeklyComment]:
    FirstWeeklyCommentChallengeModalContent as ChallengeContentComponent,
  [ChallengeName.Referrals]:
    ReferralsChallengeModalContent as ChallengeContentComponent,
  [ChallengeName.ReferralsVerified]:
    ReferralsChallengeModalContent as ChallengeContentComponent,
  default: DefaultChallengeContent as ChallengeContentComponent
}

export const getChallengeContent = (
  challengeName: ChallengeName
): ChallengeContentComponent => {
  return (
    challengeContentRegistry[challengeName] ?? challengeContentRegistry.default
  )
}
