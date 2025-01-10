import type { BadgeTier } from '@audius/common/models'
import type { ImageStyle } from 'react-native'

import type { IconProps, IconSize } from '@audius/harmony-native'
import {
  IconTokenBronze,
  IconTokenGold,
  IconTokenPlatinum,
  IconTokenSilver,
  IconTokenNoTier
} from '@audius/harmony-native'

const audioTierMap = {
  none: IconTokenNoTier,
  bronze: IconTokenBronze,
  silver: IconTokenSilver,
  gold: IconTokenGold,
  platinum: IconTokenPlatinum
}

type IconBadgeProps = IconProps & {
  tier: BadgeTier
  showNoTier?: boolean
} & (
    | {
        height: number
        width: number
      }
    | {
        size: IconSize
      }
  )

export const IconAudioBadge = (props: IconBadgeProps) => {
  const { tier, showNoTier, size, style: styleProp, ...other } = props

  const style = [styleProp as ImageStyle]

  if (tier === 'none' && !showNoTier) return null

  const AudioBadge = audioTierMap[tier]

  return <AudioBadge size={size} style={style} {...other} />
}
