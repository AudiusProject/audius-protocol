import { ReactionTypes  } from '@audius/common/store'
     import type { ComponentType } from 'react'

import type { } from '@audius/common'
import type { SetOptional } from 'type-fest'

import type { ReactionProps as BaseReactionProps } from './Reaction'
import { Reaction } from './Reaction'
import explode from './exploding_head.json'
import fire from './fire.json'
import party from './partying_face.json'
import heart from './smiling_face_with_heart_eyes.json'

export type ReactionProps = SetOptional<
  BaseReactionProps,
  'source' | 'reactionType'
>

export const HeartReaction = (props: ReactionProps) => (
  <Reaction {...props} reactionType='😍' source={heart} />
)
export const FireReaction = (props: ReactionProps) => (
  <Reaction {...props} reactionType='🔥' source={fire} />
)
export const PartyReaction = (props: ReactionProps) => (
  <Reaction {...props} reactionType='🥳' source={party} />
)
export const ExplodeReaction = (props: ReactionProps) => (
  <Reaction {...props} reactionType='🤯' source={explode} />
)

export const reactionMap: {
  [k in ReactionTypes]: ComponentType<ReactionProps>
} = {
  '😍': HeartReaction,
  '🔥': FireReaction,
  '🥳': PartyReaction,
  '🤯': ExplodeReaction
}
