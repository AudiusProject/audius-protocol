import React from 'react'

import { Reaction } from './Reaction'
import explode from './exploding_head.json'
import fire from './fire.json'
import party from './partying_face.json'
import heart from './smiling_face_with_heart_eyes.json'

export const FireReaction = () => <Reaction animationData={fire} />
export const HeartReaction = () => <Reaction animationData={heart} />
export const ExplodeReaction = () => <Reaction animationData={explode} />
export const PartyReaction = () => <Reaction animationData={party} />

export const reactions = {
  fire: FireReaction,
  heart: HeartReaction,
  explode: ExplodeReaction,
  party: PartyReaction
}
