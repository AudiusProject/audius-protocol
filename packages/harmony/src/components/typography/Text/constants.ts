import type { TextVariant, VariantSizeTagMap } from './types'

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
  }
}
