import IconTokenAUDIOPng from '@audius/harmony/src/assets/icons/TokenAUDIO.png'
import type { ImageProps } from 'react-native'
import { Image } from 'react-native'

import { iconSizes, type IconSize } from '../foundations'

import { HexagonalIcon } from './HexagonalIcon'

type Props = Omit<ImageProps, 'source'> & {
  size?: IconSize
}

export const IconTokenAUDIO = ({ size = 'm', style, ...props }: Props) => {
  const iconSize = iconSizes[size]

  return (
    <HexagonalIcon size={iconSize}>
      <Image
        source={IconTokenAUDIOPng}
        style={[
          {
            width: iconSize,
            height: iconSize
          },
          style
        ]}
        {...props}
      />
    </HexagonalIcon>
  )
}
