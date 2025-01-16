import IconTokenPlatinumPng from '@audius/harmony/src/assets/icons/TokenPlatinum.png'
import type { ImageProps } from 'react-native'
import { Image } from 'react-native'

import { iconSizes, type IconSize } from '../foundations'

type Props = Omit<ImageProps, 'source'> & {
  size?: IconSize
}

export const IconTokenPlatinum = ({ size = 'm', style, ...props }: Props) => (
  <Image
    source={IconTokenPlatinumPng}
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
