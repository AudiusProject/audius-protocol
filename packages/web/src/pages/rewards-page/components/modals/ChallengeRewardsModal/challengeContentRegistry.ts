import { ChallengeName } from '@audius/common/models'

import { AudioMatchingRewardsModalContent } from './AudioMatchingRewardsModalContent'
import { DefaultChallengeContent } from './DefaultChallengeContent'
import { ListenStreakChallengeModalContent } from './ListenStreakChallengeModalContent'
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
  default: DefaultChallengeContent as ChallengeContentComponent
}

export const getChallengeContent = (
  challengeName: ChallengeName
): ChallengeContentComponent => {
  return (
    challengeContentRegistry[challengeName] ?? challengeContentRegistry.default
  )
}
