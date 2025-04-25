import IconTokenAUDIOPng from '@audius/harmony/src/assets/icons/TokenAUDIO.png'
import type { ImageProps } from 'react-native'
import { Image } from 'react-native'

import { iconSizes, type IconSize } from '../foundations'

type Props = Omit<ImageProps, 'source'> & {
  size?: IconSize
}

export const IconTokenAUDIO = ({ size = 'm', style, ...props }: Props) => (
  <Image
    source={IconTokenAUDIOPng}
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
