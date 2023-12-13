import type { AvatarProps as HarmonyAvatarProps } from '@audius/harmony'
import { css } from '@emotion/native'
import { View, type ImageBackgroundProps, ImageBackground } from 'react-native'
import type { SetRequired } from 'type-fest'

import { useTheme } from '@audius/harmony-native'

export type AvatarProps = Omit<HarmonyAvatarProps, 'src'> &
  SetRequired<ImageBackgroundProps, 'accessibilityLabel'>

const sizeMap = {
  auto: '100%',
  small: 24,
  large: 40,
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
      <ImageBackground style={imageCss} source={source} {...other}>
        {children}
      </ImageBackground>
    </View>
  )
}
