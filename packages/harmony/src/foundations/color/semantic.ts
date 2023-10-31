import type { Theme } from '../theme/types'

import type { GradientColor, PrimitiveColors } from './primitive'
import { primitiveTheme } from './primitive'

export type SemanticColors = {
  textIcon: {
    heading: GradientColor
    default: string
    subdued: string
    disabled: string
  }
  background: {
    default: string
    white: string
    surface1: string
    surface2: string
  }
  border: {
    default: string
    strong: string
  }
  focus: string
  status: {
    error: string
    warning: string
    success: string
  }
}

const createSemanticTheme = (primitives: PrimitiveColors): SemanticColors => ({
  textIcon: {
    heading: primitives.special.gradient,
    default: primitives.neutral.neutral,
    subdued: primitives.neutral.n400,
    disabled: primitives.neutral.n150
  },
  background: {
    default: primitives.special.background,
    white: primitives.special.white,
    surface1: primitives.neutral.n25,
    surface2: primitives.neutral.n100
  },
  border: {
    default: primitives.neutral.n100,
    strong: primitives.neutral.n150
  },
  focus: primitives.secondary.secondary,
  status: {
    error: primitives.special.red,
    warning: primitives.special.orange,
    success: primitives.special.green
  }
})

export const semanticTheme: Record<Theme, SemanticColors> = {
  day: createSemanticTheme(primitiveTheme.day),
  dark: createSemanticTheme(primitiveTheme.dark),
  matrix: createSemanticTheme(primitiveTheme.matrix)
}
