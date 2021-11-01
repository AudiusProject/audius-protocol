import React from 'react'

import { Text as RNText } from 'react-native'
import { useThemeColors } from '../../utils/theme'

const fontByWeight = {
  heavy: 'AvenirNextLTPro-Heavy',
  bold: 'AvenirNextLTPro-Bold',
  medium: 'AvenirNextLTPro-Medium',
  regular: 'AvenirNextLTPro-Regular',
  light: 'AvenirNextLTPro-Light',
  thin: 'AvenirNextLTPro-Thin',
  ultraLight: 'AvenirNextLTPro-UltLt'
}

type Props = {
  children: React.ReactNode
  weight?: keyof typeof fontByWeight
} & ConstructorParameters<typeof RNText>[0]

/**
 * A custom Text component that applies the default font family and color
 */
const Text = ({ children, weight = 'regular', style, ...props }: Props) => {
  const { neutral } = useThemeColors()
  return (
    <RNText
      style={[{ color: neutral, fontFamily: fontByWeight[weight] }, style]}
      {...props}
    >
      {children}
    </RNText>
  )
}

export default Text
