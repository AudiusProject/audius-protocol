import type { ComponentType } from 'react'

import { ChallengeName } from '@audius/common/models'

import { AudioMatchingChallengeContent } from './AudioMatchingChallengeContent'
import { DefaultChallengeContent } from './DefaultChallengeContent'
import { ListenStreakEndlessChallengeContent } from './ListenStreakEndlessChallengeContent'
import { ProfileCompletionChallengeContent } from './ProfileCompletionChallengeContent'
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
