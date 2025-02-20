import { ReactNode } from 'react'

import { ChallengeName, OptimisticUserChallenge } from '@audius/common/models'

export type BaseChallengeContentProps = {
  challenge?: OptimisticUserChallenge
  onNavigateAway: () => void
  errorContent?: ReactNode
}

export type DefaultChallengeProps = BaseChallengeContentProps & {
  challengeName: Exclude<
    ChallengeName,
    | ChallengeName.AudioMatchingBuy
    | ChallengeName.AudioMatchingSell
    | ChallengeName.ListenStreakEndless
    | ChallengeName.OneShot
  >
}

export type AudioMatchingChallengeProps = BaseChallengeContentProps & {
  challengeName:
    | ChallengeName.AudioMatchingBuy
    | ChallengeName.AudioMatchingSell
}

export type ListenStreakChallengeProps = BaseChallengeContentProps & {
  challengeName: ChallengeName.ListenStreakEndless
}

export type OneShotChallengeProps = BaseChallengeContentProps & {
  challengeName: ChallengeName.OneShot
}

export type ChallengeContentProps =
  | AudioMatchingChallengeProps
  | ListenStreakChallengeProps
  | OneShotChallengeProps
  | DefaultChallengeProps

export type ChallengeContentComponent =
  React.ComponentType<ChallengeContentProps>

export type ChallengeContentMap = Partial<
  Record<ChallengeName, ChallengeContentComponent>
> & {
  default: ChallengeContentComponent
}
