import React from 'react'

import { useSelector } from 'react-redux'

import { makeGetCurrent } from 'store/player/selectors'
import { Genre } from 'utils/genres'

import BackwardSkipButton, {
  BackwardSkipButtonProps
} from './BackwardSkipButton'
import PreviousButton, { PreviousButtonProps } from './PreviousButton'

type PreviousButtonProviderProps = PreviousButtonProps | BackwardSkipButtonProps

const PreviousButtonProvider = (props: PreviousButtonProviderProps) => {
  const { track } = useSelector(makeGetCurrent())
  const isPodcast = track && track.genre === Genre.PODCASTS
  return isPodcast ? (
    <BackwardSkipButton {...props} />
  ) : (
    <PreviousButton {...props} />
  )
}

export default PreviousButtonProvider
