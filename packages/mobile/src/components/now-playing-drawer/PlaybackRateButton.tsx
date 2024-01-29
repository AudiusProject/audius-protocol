import type { PlaybackRate } from '@audius/common'
import { playerSelectors } from '@audius/common'
import { useSelector } from 'react-redux'

import { Icon0_5x } from '@audius/harmony-native'
import { Icon0_8x } from '@audius/harmony-native'
import { Icon1_1x } from '@audius/harmony-native'
import { Icon1_2x } from '@audius/harmony-native'
import { Icon1_5x } from '@audius/harmony-native'
import { Icon1x } from '@audius/harmony-native'
import { Icon2_5x } from '@audius/harmony-native'
import { Icon2x } from '@audius/harmony-native'
import { Icon3x } from '@audius/harmony-native'
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
