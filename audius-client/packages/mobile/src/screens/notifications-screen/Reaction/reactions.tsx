import { Reaction, ReactionProps as BaseReactionProps } from './Reaction'
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

export const reactions = {
  heart: HeartReaction,
  fire: FireReaction,
  party: PartyReaction,
  explode: ExplodeReaction
}

export type ReactionTypes = keyof typeof reactions
