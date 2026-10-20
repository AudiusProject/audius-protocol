import type { PrimitiveColors } from './primitive'
import { primitiveTheme } from './primitive'

// Neue headings are plain text; Classic and Matrix keep the gradient.
const createSemanticTheme = (
  primitives: PrimitiveColors,
  { gradientHeading = false } = {}
) => ({
  text: {
    default: primitives.neutral.n800,
    subdued: primitives.neutral.n400,
    disabled: primitives.neutral.n150,
    link: primitives.primary.p400,
    accent: primitives.secondary.s300,
    inverse: primitives.neutral.n950,

    // Legacy compatibility
    heading: gradientHeading
      ? primitives.special.gradient
      : primitives.neutral.n800,
    active: primitives.primary.p300,
    white: primitives.special.white,
    staticWhite: primitives.static.staticWhite,
    warning: primitives.special.orange,
    danger: primitives.special.red,
    success: primitives.special.green,
    premium: primitives.special.lightGreen,
    special: primitives.special.blue,
    fanClub: primitives.special.coinGradient
  },
  icon: {
    default: primitives.neutral.n800,
    subdued: primitives.neutral.n400,
    disabled: primitives.neutral.n150,
    link: primitives.primary.p400,
    accent: primitives.secondary.s300,
    inverse: primitives.static.staticWhite,

    // Legacy compatibility
    heading: gradientHeading
      ? primitives.special.gradient
      : primitives.neutral.n800,
    active: primitives.primary.p300,
    white: primitives.special.white,
    staticWhite: primitives.static.staticWhite,
    warning: primitives.special.orange,
    danger: primitives.special.red,
    success: primitives.special.green,
    premium: primitives.special.lightGreen,
    special: primitives.special.blue,
    fanClub: primitives.special.coinGradient
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
    primary: primitives.primary.p300,
    gradient: primitives.special.gradient,
    fanClub: primitives.special.coinGradient,

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

export const semanticTheme = {
  defaultLight: createSemanticTheme(primitiveTheme.defaultLight),
  defaultDark: createSemanticTheme(primitiveTheme.defaultDark),
  classicLight: createSemanticTheme(primitiveTheme.classicLight, {
    gradientHeading: true
  }),
  classicDark: createSemanticTheme(primitiveTheme.classicDark, {
    gradientHeading: true
  }),
  matrix: createSemanticTheme(primitiveTheme.matrix, {
    gradientHeading: true
  }),
  /** @deprecated Use classicLight */
  day: createSemanticTheme(primitiveTheme.day, {
    gradientHeading: true
  }),
  /** @deprecated Use classicDark */
  dark: createSemanticTheme(primitiveTheme.dark, {
    gradientHeading: true
  })
}

export type SemanticColors = typeof semanticTheme.day

export type TextColors = keyof SemanticColors['text']
export type IconColors = keyof SemanticColors['icon']
export type BackgroundColors = keyof SemanticColors['background']
export type BorderColors = keyof SemanticColors['border']
export type FocusColors = keyof SemanticColors['focus']
export type StatusColors = keyof SemanticColors['status']
