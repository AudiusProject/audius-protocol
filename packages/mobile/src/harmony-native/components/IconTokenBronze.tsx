import IconTokenBronzePng from '@audius/harmony/src/assets/icons/TokenBronze.png'
import type { ImageProps } from 'react-native'
import { Image } from 'react-native'

import { iconSizes, type IconSize } from '../foundations'

type Props = Omit<ImageProps, 'source'> & {
  size?: IconSize
}

export const IconTokenBronze = ({ size = 'm', style, ...props }: Props) => (
  <Image
    source={IconTokenBronzePng}
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
