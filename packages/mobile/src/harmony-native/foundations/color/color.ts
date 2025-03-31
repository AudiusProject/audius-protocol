import { primitiveTheme as harmonyPrimitiveTheme } from '@audius/harmony/src/foundations/color/primitive'
import { themes as harmonyTheme } from '@audius/harmony/src/foundations/theme/theme'
import { merge } from 'lodash'

// linear-gradient at 315deg
const baseLinearGradient = {
  start: { x: 0, y: 1 },
  end: { x: 1, y: 0 }
}

const primitiveOverrides = {
  day: {
    special: {
      gradient: {
        ...baseLinearGradient,
        colors: [
          harmonyPrimitiveTheme.day.special.gradientStop1,
          harmonyPrimitiveTheme.day.special.gradientStop2
        ]
      }
    }
  },
  dark: {
    special: {
      gradient: {
        ...baseLinearGradient,
        colors: [
          harmonyPrimitiveTheme.dark.special.gradientStop1,
          harmonyPrimitiveTheme.dark.special.gradientStop2
        ]
      }
    }
  },
  matrix: {
    special: {
      gradient: {
        ...baseLinearGradient,
        colors: [
          harmonyPrimitiveTheme.matrix.special.gradientStop1,
          harmonyPrimitiveTheme.matrix.special.gradientStop2
        ]
      }
    }
  }
}

const semanticOverrides = {
  day: {
    text: {
      heading: primitiveOverrides.day.special.gradient
    },
    icon: {
      heading: primitiveOverrides.day.special.gradient
    }
  },
  dark: {
    text: {
      heading: primitiveOverrides.dark.special.gradient
    },
    icon: {
      heading: primitiveOverrides.dark.special.gradient
    }
  },
  matrix: {
    text: {
      heading: primitiveOverrides.matrix.special.gradient
    },
    icon: {
      heading: primitiveOverrides.matrix.special.gradient
    }
  }
}

export const colorTheme = {
  day: {
    ...harmonyTheme.day.color,
    special: {
      ...harmonyTheme.day.color.special,
      ...primitiveOverrides.day.special
    },
    text: {
      ...harmonyTheme.day.color.text,
      ...semanticOverrides.day.text
    },
    icon: {
      ...harmonyTheme.day.color.icon,
      ...semanticOverrides.day.icon
    }
  },
  dark: {
    ...harmonyTheme.dark.color,
    special: {
      ...harmonyTheme.dark.color.special,
      ...primitiveOverrides.dark.special
    },
    text: {
      ...harmonyTheme.dark.color.text,
      ...semanticOverrides.dark.text
    },
    icon: {
      ...harmonyTheme.dark.color.icon,
      ...semanticOverrides.dark.icon
    }
  },
  matrix: {
    ...harmonyTheme.matrix.color,
    special: {
      ...harmonyTheme.matrix.color.special,
      ...primitiveOverrides.matrix.special
    },
    text: {
      ...harmonyTheme.matrix.color.text,
      ...semanticOverrides.matrix.text
    },
    icon: {
      ...harmonyTheme.matrix.color.icon,
      ...semanticOverrides.matrix.icon
    }
  }
}

// Only used for story
export const primitiveTheme = merge(
  {},
  harmonyPrimitiveTheme,
  primitiveOverrides
)

export type {
  IconColors,
  SpecialColors,
  TextColors
} from '@audius/harmony/src/foundations/color'
