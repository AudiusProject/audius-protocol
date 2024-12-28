import type { PlaybackRate } from '@audius/common/store'
import { playerSelectors } from '@audius/common/store'
import {
  IconPlaybackRate0_5x,
  IconPlaybackRate0_8x,
  IconPlaybackRate1x,
  IconPlaybackRate1_1x,
  IconPlaybackRate1_2x,
  IconPlaybackRate1_5x,
  IconPlaybackRate2x,
  IconPlaybackRate2_5x,
  IconPlaybackRate3x
} from '@audius/harmony'
import { useSelector } from 'react-redux'

import type { IconButtonProps } from '@audius/harmony-native'
import { IconButton } from '@audius/harmony-native'

const { getPlaybackRate } = playerSelectors

const messages = {
  playbackLabel: 'Change Playback Rate'
}

type PlaybackRateButtonProps = Omit<IconButtonProps, 'icon'>

const playbackRateIconMap: Record<PlaybackRate, typeof IconPlaybackRate1x> = {
  '0.5x': IconPlaybackRate0_5x,
  '0.8x': IconPlaybackRate0_8x,
  '1x': IconPlaybackRate1x,
  '1.1x': IconPlaybackRate1_1x,
  '1.2x': IconPlaybackRate1_2x,
  '1.5x': IconPlaybackRate1_5x,
  '2x': IconPlaybackRate2x,
  '2.5x': IconPlaybackRate2_5x,
  '3x': IconPlaybackRate3x
}

export const PlaybackRateButton = (props: PlaybackRateButtonProps) => {
  const playbackRate = useSelector(getPlaybackRate)
  return (
    <IconButton
      icon={playbackRateIconMap[playbackRate]}
      size='xl'
      aria-label={messages.playbackLabel}
      {...props}
    />
  )
}
