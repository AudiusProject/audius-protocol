import type { ReactNode } from 'react'

import type { CornerRadiusOptions } from '@audius/harmony'
import { css } from '@emotion/native'
import { BlurView } from '@react-native-community/blur'
import type {
  ImageBackgroundProps,
  ImageSourcePropType,
  ImageStyle,
  StyleProp
} from 'react-native'
import { ImageBackground, View } from 'react-native'
import LinearGradient from 'react-native-linear-gradient'

import { useTheme } from '../../foundations/theme'

export type CoverPhotoProps = {
  profilePicture?: ImageSourcePropType
  coverPhoto?: ImageSourcePropType
  style?: StyleProp<ImageStyle>
  children?: ReactNode
  topCornerRadius?: CornerRadiusOptions
} & Omit<ImageBackgroundProps, 'source'>

export const CoverPhoto = (props: CoverPhotoProps) => {
  const {
    profilePicture,
    coverPhoto,
    style,
    children,
    topCornerRadius,
    ...other
  } = props
  const { color, cornerRadius } = useTheme()

  const rootStyle = css({
    backgroundColor: color.neutral.n300,
    height: 96,
    ...(topCornerRadius
      ? {
          borderTopLeftRadius: cornerRadius[topCornerRadius],
          borderTopRightRadius: cornerRadius[topCornerRadius],
          overflow: 'hidden'
        }
      : {})
  })

  const fullHeightStyle = css({ height: '100%' })

  return (
    <ImageBackground
      source={coverPhoto ?? profilePicture ?? { uri: undefined }}
      style={[rootStyle, style]}
      {...other}
    >
      {!profilePicture && !coverPhoto ? (
        <LinearGradient
          colors={['rgba(0, 0, 0, 0.20)', 'rgba(0, 0, 0, 0.00)']}
          start={{ x: 0, y: 1 }}
          end={{ x: 0, y: 0 }}
          style={fullHeightStyle}
        />
      ) : null}
      {profilePicture && !coverPhoto ? (
        <View style={style}>
          <BlurView blurType='light' blurAmount={20} style={fullHeightStyle} />
        </View>
      ) : null}
      {children}
    </ImageBackground>
  )
}
