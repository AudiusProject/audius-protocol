import MaskedView from '@react-native-masked-view/masked-view'
import type { TextProps } from 'react-native'
import type { LinearGradientProps } from 'react-native-linear-gradient'
import LinearGradient from 'react-native-linear-gradient'

import Text from 'app/components/text'
import { useThemeColors } from 'app/utils/theme'

export type GradientTextProps = TextProps &
  Partial<Omit<LinearGradientProps, 'style'>>

/**
 * Diagonal gradient text in the Audius colors
 */
export const GradientText = (props: GradientTextProps) => {
  const { pageHeaderGradientColor1, pageHeaderGradientColor2 } =
    useThemeColors()
  const {
    style,
    children,
    colors = [pageHeaderGradientColor1, pageHeaderGradientColor2],
    ...other
  } = props

  return (
    <MaskedView
      maskElement={
        <Text style={style} weight='heavy' {...other}>
          {children}
        </Text>
      }>
      <LinearGradient
        colors={colors}
        start={{ x: 1, y: 1 }}
        end={{ x: 0, y: 0 }}>
        <Text
          style={[style, { opacity: 0 }]}
          weight='heavy'
          {...other}
          accessibilityElementsHidden>
          {children}
        </Text>
      </LinearGradient>
    </MaskedView>
  )
}
