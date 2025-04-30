import type { ComponentType } from 'react'

import { ChallengeName } from '@audius/common/models'

import { AudioMatchingChallengeContent } from './AudioMatchingChallengeContent'
import { CosignChallengeContent } from './CosignChallengeContent'
import { DefaultChallengeContent } from './DefaultChallengeContent'
import { FirstWeeklyCommentChallengeContent } from './FirstWeeklyCommentChallengeContent'
import { ListenStreakEndlessChallengeContent } from './ListenStreakEndlessChallengeContent'
import { PinnedCommentChallengeContent } from './PinnedCommentChallengeContent'
import { PlayCountMilestoneContent } from './PlayCountMilestoneContent'
import { ProfileCompletionChallengeContent } from './ProfileCompletionChallengeContent'
import { ReferralChallengeContent } from './ReferralChallengeContent'
import { TastemakerChallengeContent } from './TastemakerChallengeContent'
import type { ChallengeContentProps } from './types'

type ChallengeContentComponent = ComponentType<ChallengeContentProps>

type ChallengeContentMap = {
  [key in ChallengeName | 'default']?: ChallengeContentComponent
}

export const challengeContentRegistry: ChallengeContentMap = {
  [ChallengeName.AudioMatchingBuy]: AudioMatchingChallengeContent,
  [ChallengeName.AudioMatchingSell]: AudioMatchingChallengeContent,
  [ChallengeName.ListenStreakEndless]: ListenStreakEndlessChallengeContent,
  [ChallengeName.ProfileCompletion]: ProfileCompletionChallengeContent,
  [ChallengeName.Referrals]: ReferralChallengeContent,
  [ChallengeName.FirstWeeklyComment]: FirstWeeklyCommentChallengeContent,
  [ChallengeName.PlayCount250]: PlayCountMilestoneContent,
  [ChallengeName.PlayCount1000]: PlayCountMilestoneContent,
  [ChallengeName.PlayCount10000]: PlayCountMilestoneContent,
  [ChallengeName.Tastemaker]: TastemakerChallengeContent,
  [ChallengeName.CommentPin]: PinnedCommentChallengeContent,
  [ChallengeName.Cosign]: CosignChallengeContent,

  default: DefaultChallengeContent
}

export const getChallengeContent = (
  challengeName: ChallengeName
): ChallengeContentComponent => {
  return (
    challengeContentRegistry[challengeName] ??
    challengeContentRegistry.default ??
    DefaultChallengeContent
  )
}
