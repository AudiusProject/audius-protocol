import { primitiveTheme as harmonyPrimitiveTheme } from '@audius/harmony/src/foundations/color/primitive'
import { themes as harmonyThemes } from '@audius/harmony/src/foundations/theme/theme'
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
        colors: ['#5B23E1', '#A22FEB']
      }
    }
  },
  dark: {
    special: {
      gradient: {
        ...baseLinearGradient,
        colors: ['#7652CC', '#B05CE6']
      }
    }
  },
  matrix: {
    special: {
      gradient: {
        ...baseLinearGradient,
        colors: ['#7652CC', '#B05CE6']
      }
    }
  },
  debug: {
    special: {
      gradient: {
        ...baseLinearGradient,
        colors: ['#FF00001A', '#FF00001A']
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
  },
  debug: {
    text: {
      heading: primitiveOverrides.debug.special.gradient
    },
    icon: {
      heading: primitiveOverrides.debug.special.gradient
    }
  }
}

export const colorTheme = {
  day: {
    ...harmonyThemes.day.color,
    special: {
      ...harmonyThemes.day.color.special,
      ...primitiveOverrides.day.special
    },
    text: {
      ...harmonyThemes.day.color.text,
      ...semanticOverrides.day.text
    },
    icon: {
      ...harmonyThemes.day.color.icon,
      ...semanticOverrides.day.icon
    }
  },
  dark: {
    ...harmonyThemes.dark.color,
    special: {
      ...harmonyThemes.dark.color.special,
      ...primitiveOverrides.dark.special
    },
    text: {
      ...harmonyThemes.dark.color.text,
      ...semanticOverrides.dark.text
    },
    icon: {
      ...harmonyThemes.dark.color.icon,
      ...semanticOverrides.dark.icon
    }
  },
  matrix: {
    ...harmonyThemes.matrix.color,
    special: {
      ...harmonyThemes.matrix.color.special,
      ...primitiveOverrides.matrix.special
    },
    text: {
      ...harmonyThemes.matrix.color.text,
      ...semanticOverrides.matrix.text
    },
    icon: {
      ...harmonyThemes.matrix.color.icon,
      ...semanticOverrides.matrix.icon
    }
  },
  debug: {
    ...harmonyThemes.debug.color,
    special: {
      ...harmonyThemes.debug.color.special,
      ...primitiveOverrides.debug.special
    },
    text: {
      ...harmonyThemes.debug.color.text,
      ...semanticOverrides.debug.text
    },
    icon: {
      ...harmonyThemes.debug.color.icon,
      ...semanticOverrides.debug.icon
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
