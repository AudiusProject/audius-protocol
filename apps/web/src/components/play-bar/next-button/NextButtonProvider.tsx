import { Genre, playerSelectors } from '@audius/common'
import { useSelector } from 'react-redux'

import ForwardSkipButton, { ForwardSkipButtonProps } from './ForwardSkipButton'
import NextButton, { NextButtonProps } from './NextButton'

const { makeGetCurrent } = playerSelectors

type NextButtonProviderProps = NextButtonProps | ForwardSkipButtonProps

const NextButtonProvider = (props: NextButtonProviderProps) => {
  const { track } = useSelector(makeGetCurrent())
  const isPodcast = track && track.genre === Genre.PODCASTS
  return isPodcast ? (
    <ForwardSkipButton {...props} />
  ) : (
    <NextButton {...props} />
  )
}

export default NextButtonProvider
