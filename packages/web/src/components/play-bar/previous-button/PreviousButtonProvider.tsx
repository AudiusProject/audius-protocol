import { playerSelectors } from '@audius/common'
import { Genre } from '@audius/common/utils'
import { useSelector } from 'react-redux'

import BackwardSkipButton, {
  BackwardSkipButtonProps
} from './BackwardSkipButton'
import PreviousButton, { PreviousButtonProps } from './PreviousButton'

const { makeGetCurrent } = playerSelectors

type PreviousButtonProviderProps = PreviousButtonProps | BackwardSkipButtonProps

const PreviousButtonProvider = (props: PreviousButtonProviderProps) => {
  const { track } = useSelector(makeGetCurrent())
  const isLongFormContent =
    track?.genre === Genre.PODCASTS || track?.genre === Genre.AUDIOBOOKS
  return isLongFormContent ? (
    <BackwardSkipButton {...props} />
  ) : (
    <PreviousButton {...props} />
  )
}

export default PreviousButtonProvider
