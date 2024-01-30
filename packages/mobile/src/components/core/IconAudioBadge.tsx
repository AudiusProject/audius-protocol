import type { BadgeTier } from '@audius/common'
import type { ImageStyle } from 'react-native'
import { Image } from 'react-native'

import type { IconProps } from '@audius/harmony-native'
import {
  IconTokenBronze,
  IconTokenGold,
  IconTokenPlatinum,
  IconTokenSilver,
  IconTokenNoTier
} from '@audius/harmony-native'

const audioTierMap = {
  none: null,
  bronze: IconTokenBronze,
  silver: IconTokenSilver,
  gold: IconTokenGold,
  platinum: IconTokenPlatinum
}

type IconBadgeProps = IconProps & {
  height: number
  width: number
  tier: BadgeTier
  showNoTier?: boolean
}

export const IconAudioBadge = (props: IconBadgeProps) => {
  const { tier, showNoTier, height, width, style: styleProp, ...other } = props

  const style = [styleProp as ImageStyle, { height, width }]

  if (tier === 'none' && !showNoTier) return null
  if (tier === 'none') {
    return <Image {...other} style={style} source={IconTokenNoTier} />
  }

  const AudioBadge = audioTierMap[tier]

  return <AudioBadge height={height} width={width} style={style} {...other} />
}
