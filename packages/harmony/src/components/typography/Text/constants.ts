import type { TextVariant, VariantSizeTagMap } from './types'

export const variantTagMap: Record<TextVariant, VariantSizeTagMap> = {
  display: {
    xl: 'h1',
    l: 'h1',
    m: 'h1',
    s: 'h1'
  },
  heading: {
    xl: 'h1',
    l: 'h2',
    m: 'h3',
    s: 'h4'
  },
  title: {
    l: 'p',
    m: 'p',
    s: 'p',
    xs: 'p'
  },
  label: {
    xl: 'label',
    l: 'label',
    m: 'label',
    s: 'label',
    xs: 'label'
  },
  body: {
    l: 'p',
    m: 'p',
    s: 'p',
    xs: 'p'
  }
}
