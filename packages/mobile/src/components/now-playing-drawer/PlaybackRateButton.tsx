import type { PlaybackRate } from '@audius/common/store'
import { playerSelectors } from '@audius/common/store'

import { useSelector } from 'react-redux'

import Icon0_5x from 'app/assets/images/iconPlaybackRate0_5x.svg'
import Icon0_8x from 'app/assets/images/iconPlaybackRate0_8x.svg'
import Icon1_1x from 'app/assets/images/iconPlaybackRate1_1x.svg'
import Icon1_2x from 'app/assets/images/iconPlaybackRate1_2x.svg'
import Icon1_5x from 'app/assets/images/iconPlaybackRate1_5x.svg'
import Icon1x from 'app/assets/images/iconPlaybackRate1x.svg'
import Icon2_5x from 'app/assets/images/iconPlaybackRate2_5x.svg'
import Icon2x from 'app/assets/images/iconPlaybackRate2x.svg'
import Icon3x from 'app/assets/images/iconPlaybackRate3x.svg'
import type { IconButtonProps } from 'app/components/core'
import { IconButton } from 'app/components/core'

const { getPlaybackRate } = playerSelectors

type PlaybackRateButtonProps = Omit<IconButtonProps, 'icon'>

const playbackRateIconMap: Record<PlaybackRate, typeof Icon1x> = {
  '0.5x': Icon0_5x,
  '0.8x': Icon0_8x,
  '1x': Icon1x,
  '1.1x': Icon1_1x,
  '1.2x': Icon1_2x,
  '1.5x': Icon1_5x,
  '2x': Icon2x,
  '2.5x': Icon2_5x,
  '3x': Icon3x
}

export const PlaybackRateButton = (props: PlaybackRateButtonProps) => {
  const playbackRate = useSelector(getPlaybackRate)
  return (
    <IconButton
      icon={playbackRateIconMap[playbackRate]}
      {...props}
      fullWidth={false}
    />
  )
}
