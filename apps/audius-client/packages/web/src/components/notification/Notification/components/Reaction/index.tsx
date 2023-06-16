import React, { ComponentType } from 'react'

import { ReactionTypes } from '@audius/common'

import { Reaction, ReactionProps as BaseReactionProps } from './Reaction'
import explode from './exploding_head.json'
import fire from './fire.json'
import party from './partying_face.json'
import heart from './smiling_face_with_heart_eyes.json'

export type ReactionProps = Omit<BaseReactionProps, 'animationData'>

export const HeartReaction = (props: ReactionProps) => (
  <Reaction {...props} animationData={heart} />
)
export const FireReaction = (props: ReactionProps) => (
  <Reaction {...props} animationData={fire} />
)
export const PartyReaction = (props: ReactionProps) => (
  <Reaction {...props} animationData={party} />
)
export const ExplodeReaction = (props: ReactionProps) => (
  <Reaction {...props} animationData={explode} />
)

export const reactionMap: {
  [k in ReactionTypes]: ComponentType<ReactionProps>
} = {
  '😍': HeartReaction,
  '🔥': FireReaction,
  '🥳': PartyReaction,
  '🤯': ExplodeReaction
}
