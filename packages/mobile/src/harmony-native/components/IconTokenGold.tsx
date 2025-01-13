import IconTokenGoldPng from '@audius/harmony/src/assets/icons/TokenGold.png'
import type { ImageProps } from 'react-native'
import { Image } from 'react-native'

import { iconSizes, type IconSize } from '../foundations'

type Props = Omit<ImageProps, 'source'> & {
  size?: IconSize
}

export const IconTokenGold = ({ size = 'm', style, ...props }: Props) => (
  <Image
    source={IconTokenGoldPng}
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
