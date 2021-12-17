import React from 'react'

import MaskedView from '@react-native-masked-view/masked-view'
import { TextStyle } from 'react-native'
import LinearGradient from 'react-native-linear-gradient'

import Text from 'app/components/text'
import { useThemeColors } from 'app/utils/theme'

type Props = {
  /**
   * Style to be applied to the text
   */
  style?: TextStyle
  /**
   * The text to be displayed
   */
  text: string
}

/**
 * Diagonal gradient text in the Audius colors
 */
const GradientText = ({ style, text }: Props) => {
  const {
    pageHeaderGradientColor1,
    pageHeaderGradientColor2
  } = useThemeColors()

  return (
    <MaskedView
      maskElement={
        <Text style={style} weight='heavy'>
          {text}
        </Text>
      }
    >
      <LinearGradient
        colors={[pageHeaderGradientColor1, pageHeaderGradientColor2]}
        start={{ x: 1, y: 1 }}
        end={{ x: 0, y: 0 }}
      >
        <Text style={[style, { opacity: 0 }]} weight='heavy'>
          {text}
        </Text>
      </LinearGradient>
    </MaskedView>
  )
}

export default GradientText
