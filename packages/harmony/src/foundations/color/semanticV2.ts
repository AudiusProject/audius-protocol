import { Theme } from '../theme/types'

import type { PrimitiveColorsV2 } from './primitiveV2'
import { primitiveThemeV2 } from './primitiveV2'

const createSemanticThemeV2 = (
  theme: Theme,
  primitives: PrimitiveColorsV2
) => ({
  text: {
    default: primitives.neutral.n800,
    subdued: primitives.neutral.n400,
    disabled: primitives.neutral.n150,
    link: primitives.primary.p500,
    accent: primitives.secondary.s300,
    inverse:
      theme === 'day' ? primitives.neutral.n950 : primitives.special.white,

    // Legacy compatibility
    heading: primitives.special.gradient,
    active: primitives.primary.p300,
    staticWhite: primitives.special.white,
    staticStaticWhite: primitives.static.staticWhite,
    warning: primitives.special.orange,
    danger: primitives.special.red,
    premium: primitives.special.lightGreen,
    special: primitives.special.blue
  },
  icon: {
    default: primitives.neutral.n800,
    subdued: primitives.neutral.n400,
    disabled: primitives.neutral.n150,
    link: primitives.primary.p500,
    accent: primitives.secondary.s300,
    inverse:
      theme === 'day' ? primitives.neutral.n950 : primitives.special.white,

    // Legacy compatibility
    heading: primitives.special.gradient,
    active: primitives.primary.p300,
    staticWhite: primitives.special.white,
    staticStaticWhite: primitives.static.staticWhite,
    warning: primitives.special.orange,
    danger: primitives.special.red,
    premium: primitives.special.lightGreen,
    special: primitives.special.blue
  },
  link: {
    default: primitives.neutral.n800,
    subdued: primitives.neutral.n400,
    visible: primitives.primary.p500,
    inverted: primitives.static.white
  },
  background: {
    default: primitives.special.background,
    surface1: primitives.neutral.n25,
    surface2: primitives.neutral.n50,
    white: primitives.special.white,

    // Legacy compatibility
    accent: primitives.secondary.s300
  },
  border: {
    default: primitives.neutral.n100,
    strong: primitives.neutral.n150,
    negative: primitives.special.white,
    accent: primitives.secondary.s300
  },
  focus: {
    default: primitives.secondary.s300
  },
  status: {
    error: primitives.special.red,
    warning: primitives.special.orange,
    success: primitives.special.green,
    danger: primitives.special.red
  }
})

export const semanticThemeV2 = {
  day: createSemanticThemeV2('day', primitiveThemeV2.day),
  dark: createSemanticThemeV2('dark', primitiveThemeV2.dark),
  matrix: createSemanticThemeV2('matrix', primitiveThemeV2.matrix)
}

export type SemanticColorsV2 = typeof semanticThemeV2.day

export type TextColorsV2 = keyof SemanticColorsV2['text']
export type IconColorsV2 = keyof SemanticColorsV2['icon']
export type BackgroundColorsV2 = keyof SemanticColorsV2['background']
export type BorderColorsV2 = keyof SemanticColorsV2['border']
export type FocusColorsV2 = keyof SemanticColorsV2['focus']
export type StatusColorsV2 = keyof SemanticColorsV2['status']
