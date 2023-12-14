import {
  themes as harmonyThemes,
  primitiveTheme as harmonyPrimitiveTheme
} from '@audius/harmony'
import { mapValues, merge } from 'lodash'

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

const typographyOverrides = {
  fontByWeight: {
    ultraLight: 'AvenirNextLTPro-UltLt',
    thin: 'AvenirNextLTPro-Thin',
    light: 'AvenirNextLTPro-Light',
    regular: 'AvenirNextLTPro-Regular',
    medium: 'AvenirNextLTPro-Medium',
    demiBold: 'AvenirNextLTPro-DemiBold',
    bold: 'AvenirNextLTPro-Bold',
    heavy: 'AvenirNextLTPro-Heavy'
  },
  lineHeight: mapValues(harmonyThemes.day.typography.lineHeight, (pxSize) =>
    parseInt(pxSize)
  )
}

const shadowOverrides = {
  near: {
    // IOS
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    shadowColor: '#000',
    // Android
    elevation: 1
  },
  mid: {
    // IOS
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    shadowColor: '#000',
    // Android
    elevation: 2
  },
  midInverted: {
    // IOS
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: -4 },
    shadowColor: '#000',
    // Android
    elevation: 2
  },
  far: {
    // IOS
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 16,
    shadowOpacity: 0.08,
    shadowColor: '#000',
    // Android
    elevation: 3
  },
  emphasis: {
    // IOS
    shadowOffset: { width: 0, height: 1.34018 },
    shadowRadius: 8,
    shadowOpacity: 0.2,
    shadowColor: '#000',
    // Android
    elevation: 6
  },
  special: {
    // IOS
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 17,
    shadowOpacity: 0.2,
    shadowColor: '#565776',
    // Android
    elevation: 6
  },
  flat: {
    elevation: 0,
    shadowRadius: 0,
    shadowOffset: { width: 0, height: 0 }
  }
}

const commonFoundations = {
  shadows: shadowOverrides,
  typography: {
    ...harmonyThemes.day.typography,
    ...typographyOverrides
  },
  cornerRadius: harmonyThemes.day.cornerRadius,
  spacing: harmonyThemes.day.spacing,
  iconSizes: harmonyThemes.day.iconSizes
}

export const theme = {
  day: {
    type: harmonyThemes.day.type,
    color: {
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
        ...semanticOverrides.day.text
      }
    },
    ...commonFoundations
  },
  dark: {
    type: harmonyThemes.dark.type,
    color: {
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
        ...semanticOverrides.dark.text
      }
    },
    ...commonFoundations
  },
  matrix: {
    type: harmonyThemes.matrix.type,
    color: {
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
        ...semanticOverrides.matrix.text
      }
    },
    ...commonFoundations
  }
}

export type HarmonyNativeTheme = typeof theme['dark']

// Only used for story
export const primitiveTheme = merge(
  {},
  harmonyPrimitiveTheme,
  primitiveOverrides
)
