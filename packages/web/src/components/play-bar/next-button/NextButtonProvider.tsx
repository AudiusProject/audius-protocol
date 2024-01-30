import { playerSelectors } from '@audius/common'
import { Genre } from '@audius/common/utils'
import { useSelector } from 'react-redux'

import ForwardSkipButton, { ForwardSkipButtonProps } from './ForwardSkipButton'
import NextButton, { NextButtonProps } from './NextButton'

const { makeGetCurrent } = playerSelectors

type NextButtonProviderProps = NextButtonProps | ForwardSkipButtonProps

const NextButtonProvider = (props: NextButtonProviderProps) => {
  const { track } = useSelector(makeGetCurrent())
  const isLongFormContent =
    track?.genre === Genre.PODCASTS || track?.genre === Genre.AUDIOBOOKS
  return isLongFormContent ? (
    <ForwardSkipButton {...props} />
  ) : (
    <NextButton {...props} />
  )
}

export default NextButtonProvider
