import type { BadgeTier } from '@audius/common'
import type { ImageStyle } from 'react-native'
import { Image } from 'react-native'

import type { IconProps } from '@audius/harmony-native'
import IconBronzeBadge from 'app/assets/images/IconBronzeBadge.svg'
import IconGoldBadge from 'app/assets/images/IconGoldBadge.svg'
import IconPlatinumBadge from 'app/assets/images/IconPlatinumBadge.svg'
import IconSilverBadge from 'app/assets/images/IconSilverBadge.svg'
import IconNoTierBadge from 'app/assets/images/tokenBadgeNoTier.png'

const audioTierMap = {
  none: null,
  bronze: IconBronzeBadge,
  silver: IconSilverBadge,
  gold: IconGoldBadge,
  platinum: IconPlatinumBadge
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
    return <Image {...other} style={style} source={IconNoTierBadge} />
  }

  const AudioBadge = audioTierMap[tier]

  return <AudioBadge height={height} width={width} style={style} {...other} />
}
