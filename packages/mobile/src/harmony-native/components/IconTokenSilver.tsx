import IconTokenSilverPng from '@audius/harmony/src/assets/icons/TokenSilver.png'
import type { ImageProps } from 'react-native'
import { Image } from 'react-native'

import { iconSizes, type IconSize } from '../foundations'

type Props = Omit<ImageProps, 'source'> & {
  size?: IconSize
}

export const IconTokenSilver = ({ size = 'm', style, ...props }: Props) => (
  <Image
    source={IconTokenSilverPng}
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
