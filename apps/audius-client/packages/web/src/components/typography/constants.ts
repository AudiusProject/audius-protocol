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
    XLarge: 'h1',
    Large: 'h1',
    Medium: 'h1',
    Small: 'h1'
  },
  heading: {
    XLarge: 'h1',
    Large: 'h2',
    Medium: 'h3',
    Small: 'h4'
  },
  title: {
    Large: 'p',
    Medium: 'p',
    Small: 'p',
    XSmall: 'p'
  },
  label: {
    XLarge: 'label',
    Large: 'label',
    Medium: 'label',
    Small: 'label',
    XSmall: 'label'
  },
  body: {
    Large: 'p',
    Medium: 'p',
    Small: 'p',
    XSmall: 'p'
  }
}
