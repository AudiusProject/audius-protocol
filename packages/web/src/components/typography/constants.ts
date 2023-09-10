import { FontWeight, TextVariant, VariantSizeTagMap } from './types'

export const fontWeightMap: Record<FontWeight, number> = {
  heavy: 900,
  bold: 700,
  demiBold: 600,
  medium: 500,
  regular: 400,
  light: 300,
  thin: 200,
  ultraLight: 100
}

export const variantTagMap: Record<TextVariant, VariantSizeTagMap> = {
  display: {
    xLarge: 'h1',
    large: 'h1',
    medium: 'h1',
    small: 'h1'
  },
  heading: {
    xLarge: 'h1',
    large: 'h2',
    medium: 'h3',
    small: 'h4'
  },
  title: {
    large: 'p',
    medium: 'p',
    small: 'p',
    xSmall: 'p'
  },
  label: {
    xLarge: 'label',
    large: 'label',
    medium: 'label',
    small: 'label',
    xSmall: 'label'
  },
  body: {
    large: 'p',
    medium: 'p',
    small: 'p',
    xSmall: 'p'
  },
  inherit: {
    large: 'span',
    medium: 'span',
    small: 'span',
    xSmall: 'span'
  }
}
