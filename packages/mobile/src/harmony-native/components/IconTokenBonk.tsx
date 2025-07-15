import IconTokenBonkPng from '@audius/harmony/src/assets/icons/TokenBonk.png'
import type { ImageProps } from 'react-native'
import { Image } from 'react-native'

import { iconSizes, type IconSize } from '../foundations'

import { HexagonalIcon } from './HexagonalIcon'

type Props = Omit<ImageProps, 'source'> & {
  size?: IconSize
}

export const IconTokenBonk = ({ size = 'm', style, ...props }: Props) => {
  const iconSize = iconSizes[size]

  return (
    <HexagonalIcon size={iconSize}>
      <Image
        source={IconTokenBonkPng}
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
