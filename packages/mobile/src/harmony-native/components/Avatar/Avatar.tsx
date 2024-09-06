import type { PickRename } from '@audius/common/utils'
import type { AvatarProps as HarmonyAvatarProps } from '@audius/harmony/src/components/avatar/types'
import { css } from '@emotion/native'
import { View } from 'react-native'
import type { SetRequired } from 'type-fest'

import type { BoxProps } from '@audius/harmony-native'
import { Box, useTheme } from '@audius/harmony-native'

import type { FastImageProps } from '../FastImage/FastImage'
import { FastImage } from '../FastImage/FastImage'

type TweakedFastImageProps = Omit<FastImageProps, 'priority'> &
  // Renamed priority prop to imagePriority
  Partial<PickRename<FastImageProps, 'priority', 'imagePriority'>>

export type AvatarProps = Omit<HarmonyAvatarProps, 'src'> &
  (
    | SetRequired<TweakedFastImageProps, 'accessibilityLabel'>
    | (TweakedFastImageProps & { 'aria-hidden'?: true })
  ) &
  BoxProps

const sizeMap = {
  auto: undefined,
  small: 24,
  medium: 40,
  large: 72,
  xl: 80
}

const strokeWidthMap = {
  thin: 1.2,
  default: 2
}

/*
 * The Avatar component is a visual indicator used to quickly identify a
 * user’s account.
 */
export const Avatar = (props: AvatarProps) => {
  const {
    children,
    source,
    size = 'auto',
    strokeWidth = size === 'small' ? 'thin' : 'default',
    variant = 'default',
    style,
    ...other
  } = props

  const { color, shadows } = useTheme()

  const borderRadius = 9999

  const rootCss = css({
    height: sizeMap[size],
    width: sizeMap[size],
    backgroundColor: color.neutral.n400,
    borderRadius,
    borderWidth: strokeWidthMap[strokeWidth],
    borderStyle: 'solid',
    borderColor: color.border.default,
    ...(variant === 'strong' && shadows.mid)
  })

  const imageCss = css({
    width: '100%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderRadius
  })

  return (
    <Box {...other}>
      <Box style={[rootCss, style]}>
        {source !== undefined ? (
          <FastImage style={imageCss} source={source}>
            {children}
          </FastImage>
        ) : (
          <View style={imageCss}>{children}</View>
        )}
      </Box>
    </Box>
  )
}
