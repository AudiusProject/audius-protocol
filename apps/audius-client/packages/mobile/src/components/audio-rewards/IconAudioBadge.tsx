import type { BadgeTier } from '@audius/common'
import type { ImageProps } from 'react-native'
import { Image } from 'react-native'
import type { SvgProps } from 'react-native-svg'

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

type IconBadgeProps = SvgProps & {
  tier: BadgeTier
  showNoTier?: boolean
}

export const IconAudioBadge = (props: IconBadgeProps) => {
  const { tier, showNoTier, ...other } = props

  if (tier === 'none' && !showNoTier) return null
  if (tier === 'none') {
    return <Image {...(other as ImageProps)} source={IconNoTierBadge} />
  }

  const AudioBadge = audioTierMap[tier]

  return <AudioBadge {...other} />
}
