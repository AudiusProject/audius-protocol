import type { PrimitiveColors } from './primitive'
import { primitiveTheme } from './primitive'

const createSemanticTheme = (primitives: PrimitiveColors) => ({
  text: {
    heading: primitives.special.gradient,
    default: primitives.neutral.neutral,
    subdued: primitives.neutral.n400,
    disabled: primitives.neutral.n150,
    accent: primitives.secondary.s300,
    staticWhite: primitives.static.white,
    warning: primitives.special.orange,
    danger: primitives.special.red
  },
  icon: {
    heading: primitives.special.gradient,
    default: primitives.neutral.neutral,
    subdued: primitives.neutral.n400,
    disabled: primitives.neutral.n150,
    accent: primitives.secondary.s300,
    staticWhite: primitives.static.white
  },
  link: {
    default: primitives.neutral.neutral,
    visible: primitives.primary.p500,
    inverted: primitives.static.white
  },
  background: {
    default: primitives.special.background,
    white: primitives.special.white,
    surface1: primitives.neutral.n25,
    surface2: primitives.neutral.n100,
    accent: primitives.secondary.s300
  },
  border: {
    default: primitives.neutral.n100,
    strong: primitives.neutral.n150
  },
  focus: { default: primitives.secondary.secondary },
  status: {
    error: primitives.special.red,
    warning: primitives.special.orange,
    success: primitives.special.green
  }
})

export const semanticTheme = {
  day: createSemanticTheme(primitiveTheme.day),
  dark: createSemanticTheme(primitiveTheme.dark),
  matrix: createSemanticTheme(primitiveTheme.matrix)
}

export type SemanticColors = typeof semanticTheme.day

export type TextColors = keyof SemanticColors['text']
export type IconColors = keyof SemanticColors['icon']
export type BackgroundColors = keyof SemanticColors['background']
export type BorderColors = keyof SemanticColors['border']
export type FocusColors = keyof SemanticColors['focus']
export type StatusColors = keyof SemanticColors['status']
