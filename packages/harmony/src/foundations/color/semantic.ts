import type { Theme } from '../theme/types'

import type { GradientColor } from './primitive'
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

export const semanticTheme: Record<Theme, SemanticColors> = {
  day: {
    textIcon: {
      heading: primitiveTheme.day.special.gradient,
      default: primitiveTheme.day.neutral.neutral,
      subdued: primitiveTheme.day.neutral.n400,
      disabled: primitiveTheme.day.neutral.n150
    },
    background: {
      default: primitiveTheme.day.special.background,
      white: primitiveTheme.day.special.white,
      surface1: primitiveTheme.day.neutral.n25,
      surface2: primitiveTheme.day.neutral.n100
    },
    border: {
      default: primitiveTheme.day.neutral.n100,
      strong: primitiveTheme.day.neutral.n150
    },
    focus: primitiveTheme.day.secondary.secondary,
    status: {
      error: primitiveTheme.day.special.red,
      warning: primitiveTheme.day.special.orange,
      success: primitiveTheme.day.special.green
    }
  },
  dark: {
    textIcon: {
      heading: primitiveTheme.dark.special.gradient,
      default: primitiveTheme.dark.neutral.neutral,
      subdued: primitiveTheme.dark.neutral.n400,
      disabled: primitiveTheme.dark.neutral.n150
    },
    background: {
      default: primitiveTheme.dark.special.background,
      white: primitiveTheme.dark.special.white,
      surface1: primitiveTheme.dark.neutral.n25,
      surface2: primitiveTheme.dark.neutral.n100
    },
    border: {
      default: primitiveTheme.dark.neutral.n100,
      strong: primitiveTheme.dark.neutral.n150
    },
    focus: primitiveTheme.dark.secondary.secondary,
    status: {
      error: primitiveTheme.dark.special.red,
      warning: primitiveTheme.dark.special.orange,
      success: primitiveTheme.dark.special.green
    }
  },
  matrix: {
    textIcon: {
      heading: primitiveTheme.matrix.special.gradient,
      default: primitiveTheme.matrix.neutral.neutral,
      subdued: primitiveTheme.matrix.neutral.n400,
      disabled: primitiveTheme.matrix.neutral.n150
    },
    background: {
      default: primitiveTheme.matrix.special.background,
      white: primitiveTheme.matrix.special.white,
      surface1: primitiveTheme.matrix.neutral.n25,
      surface2: primitiveTheme.matrix.neutral.n100
    },
    border: {
      default: primitiveTheme.matrix.neutral.n100,
      strong: primitiveTheme.matrix.neutral.n150
    },
    focus: primitiveTheme.matrix.secondary.secondary,
    status: {
      error: primitiveTheme.matrix.special.red,
      warning: primitiveTheme.matrix.special.orange,
      success: primitiveTheme.matrix.special.green
    }
  }
}
