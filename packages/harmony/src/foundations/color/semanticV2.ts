import type { PrimitiveColorsV2 } from './primitiveV2'
import { primitiveThemeV2 } from './primitiveV2'

const createSemanticThemeV2 = (primitives: PrimitiveColorsV2) => ({
  text: {
    default: primitives.neutral.n800,
    disabled: primitives.neutral.n150,
    subdued: primitives.neutral.n400,
    accent: primitives.secondary.s300,
    link: primitives.primary.p500,
    inverseWhite: primitives.primary.p500,

    // The following are for compatibility
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
    disabled: primitives.neutral.n150,
    subdued: primitives.neutral.n400,
    accent: primitives.secondary.s300,
    link: primitives.primary.p500,
    inverseWhite: primitives.primary.p500,

    // The following are for compatibility
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
    surface2: primitives.neutral.n100,
    white: primitives.special.white,

    // The following are for compatibility
    accent: primitives.secondary.s300
  },
  border: {
    default: primitives.neutral.n100,
    strong: primitives.neutral.n150,
    accent: primitives.secondary.s300
  },
  focus: {
    default: primitives.secondary.s300
  },
  status: {
    error: primitives.special.red,
    warning: primitives.special.orange,
    success: primitives.special.green
  }
})

export const semanticThemeV2 = {
  day: createSemanticThemeV2(primitiveThemeV2.day),
  dark: createSemanticThemeV2(primitiveThemeV2.dark),
  matrix: createSemanticThemeV2(primitiveThemeV2.matrix)
}

export type SemanticColorsV2 = typeof semanticThemeV2.day

export type TextColorsV2 = keyof SemanticColorsV2['text']
export type IconColorsV2 = keyof SemanticColorsV2['icon']
export type BackgroundColorsV2 = keyof SemanticColorsV2['background']
export type BorderColorsV2 = keyof SemanticColorsV2['border']
export type FocusColorsV2 = keyof SemanticColorsV2['focus']
export type StatusColorsV2 = keyof SemanticColorsV2['status']
