import type { ComponentType } from 'react'

import type { ReactionTypes } from 'audius-client/src/common/store/ui/reactions/slice'

import type { ReactionProps as BaseReactionProps } from './Reaction'
import { Reaction } from './Reaction'
import explode from './exploding_head.json'
import fire from './fire.json'
import party from './partying_face.json'
import heart from './smiling_face_with_heart_eyes.json'

export type ReactionProps = Omit<BaseReactionProps, 'source'>

export const HeartReaction = (props: ReactionProps) => (
  <Reaction {...props} source={heart} />
)
export const FireReaction = (props: ReactionProps) => (
  <Reaction {...props} source={fire} />
)
export const PartyReaction = (props: ReactionProps) => (
  <Reaction {...props} source={party} />
)
export const ExplodeReaction = (props: ReactionProps) => (
  <Reaction {...props} source={explode} />
)

export const reactionMap: {
  [k in ReactionTypes]: ComponentType<ReactionProps>
} = {
  heart: HeartReaction,
  fire: FireReaction,
  party: PartyReaction,
  explode: ExplodeReaction
}
