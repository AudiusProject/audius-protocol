import type { ComponentType } from 'react'

import type { BadgeTier } from '@audius/common'
import type { SvgProps } from 'react-native-svg'

import IconBronzeBadge from 'app/assets/images/IconBronzeBadge.svg'
import IconGoldBadge from 'app/assets/images/IconGoldBadge.svg'
import IconPlatinumBadge from 'app/assets/images/IconPlatinumBadge.svg'
import IconSilverBadge from 'app/assets/images/IconSilverBadge.svg'

const audioTierMap: Record<BadgeTier, ComponentType<SvgProps> | null> = {
  none: null,
  bronze: IconBronzeBadge,
  silver: IconSilverBadge,
  gold: IconGoldBadge,
  platinum: IconPlatinumBadge
}

type IconBadgeProps = SvgProps & {
  tier: BadgeTier
}

export const IconAudioBadge = (props: IconBadgeProps) => {
  const { tier, ...other } = props
  const AudioBadge = audioTierMap[tier]

  return AudioBadge ? <AudioBadge {...other} /> : null
}
