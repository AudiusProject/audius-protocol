import type { AvatarProps as HarmonyAvatarProps } from '@audius/harmony'
import { css } from '@emotion/native'
import { View } from 'react-native'
import type { SetRequired } from 'type-fest'

import { useTheme } from '@audius/harmony-native'

import type { FastImageProps } from '../FastImage/FastImage'
import { FastImage } from '../FastImage/FastImage'

export type AvatarProps = Omit<HarmonyAvatarProps, 'src'> &
  SetRequired<FastImageProps, 'accessibilityLabel'>

const sizeMap = {
  auto: '100%' as const,
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
    size = 'medium',
    strokeWidth = 'default',
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
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderRadius
  })

  return (
    <View style={[rootCss, style]}>
      {source !== undefined ? (
        <FastImage style={imageCss} source={source} {...other}>
          {children}
        </FastImage>
      ) : (
        <View style={imageCss} {...other}>
          {children}
        </View>
      )}
    </View>
  )
}
