export const typography = {
  weight: {
    ultraLight: 100,
    thin: 200,
    light: 300,
    regular: 400,
    medium: 500,
    demiBold: 600,
    bold: 700,
    heavy: 900
  },
  fontByWeight: {
    ultraLight: 'AvenirNextLTPro-UltLt',
    thin: 'AvenirNextLTPro-Thin',
    light: 'AvenirNextLTPro-Light',
    regular: 'AvenirNextLTPro-Regular',
    medium: 'AvenirNextLTPro-Medium',
    demiBold: 'AvenirNextLTPro-DemiBold',
    bold: 'AvenirNextLTPro-Bold',
    heavy: 'AvenirNextLTPro-Heavy'
  },
  size: {
    '2xs': 10,
    xs: 12,
    s: 14,
    m: 16,
    l: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 28,
    '4xl': 32,
    '5xl': 36,
    '6xl': 42,
    '7xl': 56,
    '8xl': 72,
    '9xl': 96
  },
  lineHeight: {
    xs: 12,
    s: 16,
    m: 20,
    l: 24,
    xl: 32,
    '2xl': 40,
    '3xl': 52,
    '4xl': 68,
    '5xl': 88,
    '6xl': 120
  }
}

export type Typography = typeof typography
