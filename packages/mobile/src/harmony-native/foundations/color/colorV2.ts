import { primitiveThemeV2 as harmonyPrimitiveThemeV2 } from '@audius/harmony/src/foundations/color/primitiveV2'
import { themesV2 as harmonyThemesV2 } from '@audius/harmony/src/foundations/theme/themeV2'
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
          harmonyPrimitiveThemeV2.day.special.gradientStop1,
          harmonyPrimitiveThemeV2.day.special.gradientStop2
        ]
      }
    }
  },
  dark: {
    special: {
      gradient: {
        ...baseLinearGradient,
        colors: [
          harmonyPrimitiveThemeV2.dark.special.gradientStop1,
          harmonyPrimitiveThemeV2.dark.special.gradientStop2
        ]
      }
    }
  },
  matrix: {
    special: {
      gradient: {
        ...baseLinearGradient,
        colors: [
          harmonyPrimitiveThemeV2.matrix.special.gradientStop1,
          harmonyPrimitiveThemeV2.matrix.special.gradientStop2
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

export const colorThemeV2 = {
  day: {
    ...harmonyThemesV2.day.color,
    special: {
      ...harmonyThemesV2.day.color.special,
      ...primitiveOverrides.day.special
    },
    text: {
      ...harmonyThemesV2.day.color.text,
      ...semanticOverrides.day.text
    },
    icon: {
      ...harmonyThemesV2.day.color.icon,
      ...semanticOverrides.day.icon
    }
  },
  dark: {
    ...harmonyThemesV2.dark.color,
    special: {
      ...harmonyThemesV2.dark.color.special,
      ...primitiveOverrides.dark.special
    },
    text: {
      ...harmonyThemesV2.dark.color.text,
      ...semanticOverrides.dark.text
    },
    icon: {
      ...harmonyThemesV2.dark.color.icon,
      ...semanticOverrides.dark.icon
    }
  },
  matrix: {
    ...harmonyThemesV2.matrix.color,
    special: {
      ...harmonyThemesV2.matrix.color.special,
      ...primitiveOverrides.matrix.special
    },
    text: {
      ...harmonyThemesV2.matrix.color.text,
      ...semanticOverrides.matrix.text
    },
    icon: {
      ...harmonyThemesV2.matrix.color.icon,
      ...semanticOverrides.matrix.icon
    }
  }
}

// Only used for story
export const primitiveThemeV2 = merge(
  {},
  harmonyPrimitiveThemeV2,
  primitiveOverrides
)

export type {
  IconColors,
  SpecialColors,
  TextColors
} from '@audius/harmony/src/foundations/color'
