import { ComponentType } from 'react'

import { SvgProps } from 'react-native-svg'

import IconBronzeBadge from 'app/assets/images/IconBronzeBadge.svg'
import IconGoldBadge from 'app/assets/images/IconGoldBadge.svg'
import IconPlatinumBadge from 'app/assets/images/IconPlatinumBadge.svg'
import IconSilverBadge from 'app/assets/images/IconSilverBadge.svg'

import { AudioTier } from './audioTier'

const audioTierMap: Record<AudioTier, ComponentType<SvgProps> | null> = {
  none: null,
  bronze: IconBronzeBadge,
  silver: IconSilverBadge,
  gold: IconGoldBadge,
  platinum: IconPlatinumBadge
}

type IconBadgeProps = SvgProps & {
  tier: AudioTier
}

export const IconAudioBadge = (props: IconBadgeProps) => {
  const { tier, ...other } = props
  const AudioBadge = audioTierMap[tier]

  return AudioBadge ? <AudioBadge {...other} /> : null
}
