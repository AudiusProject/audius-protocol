import React from 'react'

import Lottie, { LottieProps } from 'react-lottie'

type ReactionProps = {
  animationData: LottieProps['options']['animationData']
}

export const Reaction = (props: ReactionProps) => {
  const { animationData } = props
  return (
    <Lottie
      options={{ autoplay: true, loop: true, animationData }}
      height={86}
      width={86}
    />
  )
}
