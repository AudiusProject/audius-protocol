import { TextStyle } from 'react-native'

type FontWeight =
  | 'heavy'
  | 'bold'
  | 'demiBold'
  | 'medium'
  | 'regular'
  | 'light'
  | 'thin'
  | 'ultraLight'

export const fontByWeight: Record<FontWeight, string> = {
  heavy: 'AvenirNextLTPro-Heavy',
  bold: 'AvenirNextLTPro-Bold',
  demiBold: 'AvenirNextLTPro-DemiBold',
  medium: 'AvenirNextLTPro-Medium',
  regular: 'AvenirNextLTPro-Regular',
  light: 'AvenirNextLTPro-Light',
  thin: 'AvenirNextLTPro-Thin',
  ultraLight: 'AvenirNextLTPro-UltLt'
}

const fontSize = {
  xs: 12,
  small: 14,
  medium: 16,
  large: 18,
  xl: 20,
  xxl: 24,
  xxxl: 28,
  xxxxl: 32,
  xxxxxl: 64
}

export const font = (weight: FontWeight): TextStyle => ({
  fontFamily: fontByWeight[weight]
})

export const typography = {
  h1: {
    fontSize: fontSize.large,
    fontFamily: fontByWeight.bold,
    marginBottom: fontSize.large * 0.35
  },
  h2: {
    fontSize: fontSize.medium,
    fontFamily: fontByWeight.bold,
    marginBottom: fontSize.medium * 0.35
  },
  h3: {
    fontSize: fontSize.small,
    fontFamily: fontByWeight.bold,
    marginBottom: fontSize.medium * 0.35
  },
  h4: {
    fontSize: fontSize.small,
    fontFamily: fontByWeight.medium,
    marginBottom: fontSize.medium * 0.35
  },
  body: {
    fontSize: fontSize.small,
    fontFamily: fontByWeight.medium
  },
  body1: {
    fontSize: fontSize.small,
    fontFamily: fontByWeight.regular
  },
  body2: {
    fontSize: fontSize.xs,
    fontFamily: fontByWeight.medium,
    marginBottom: fontSize.xs * 0.2
  },
  fontByWeight,
  fontSize
}
