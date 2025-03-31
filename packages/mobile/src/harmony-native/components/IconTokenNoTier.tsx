import IconTokenNoTierPng from '@audius/harmony/src/assets/icons/TokenNoTier.png'
import type { ImageProps } from 'react-native'
import { Image } from 'react-native'

import { iconSizes, type IconSize } from '../foundations'

type Props = Omit<ImageProps, 'source'> & {
  size?: IconSize
}

export const IconTokenNoTier = ({ size = 'm', style, ...props }: Props) => (
  <Image
    source={IconTokenNoTierPng}
    style={[
      {
        width: iconSizes[size],
        height: iconSizes[size]
      },
      style
    ]}
    {...props}
  />
)
