import { Theme } from '@audius/common/models'
import type { HarmonyThemeV2 } from '@audius/harmony/src/foundations/theme/themeV2'
import { themesV2 } from '@audius/harmony/src/foundations/theme/themeV2'

import type { ThemeColors } from './theme'

const createMobileThemeFromHarmony = (
  harmonyTheme: HarmonyThemeV2
): ThemeColors => {
  const { color } = harmonyTheme

  return {
    aiPrimary: color.special.aiGreen,
    aiSecondary: color.special.aiGreen, // No direct mapping, using aiGreen
    background: color.special.background,
    backgroundSecondary: color.background.surface1,
    backgroundSurface: color.background.surface1,
    backgroundSurface2: color.background.surface2,
    borderDefault: color.border.default,
    borderStrong: color.border.strong,
    primary: color.primary.p300,
    primaryDark1: color.primary.p400,
    primaryDark2: color.primary.p500,
    primaryLight1: color.primary.p200,
    primaryLight2: color.primary.p100,
    secondary: color.secondary.s300,
    secondaryDark1: color.secondary.s400,
    secondaryDark2: color.secondary.s500,
    secondaryLight1: color.secondary.s200,
    secondaryLight2: color.secondary.s100,
    neutral: color.neutral.n800,
    neutralDark1: color.neutral.n900,
    neutralDark2: color.neutral.n950,
    neutralDark3: color.neutral.n950, // No direct mapping
    neutralLight1: color.neutral.n700,
    neutralLight2: color.neutral.n600,
    neutralLight3: color.neutral.n500,
    neutralLight4: color.neutral.n400,
    neutralLight5: color.neutral.n300,
    neutralLight6: color.neutral.n200,
    neutralLight7: color.neutral.n150,
    neutralLight8: color.neutral.n100,
    neutralLight9: color.neutral.n50,
    neutralLight10: color.neutral.n25,
    white: color.special.white,
    accentRed: color.special.red,
    accentRedDark1: color.special.darkRed,
    accentRedLight1: color.special.red, // No direct mapping
    accentGreen: color.special.green,
    accentGreenDark1: color.special.lightGreen,
    accentGreenLight1: color.special.green, // No direct mapping
    accentOrange: color.special.orange,
    accentOrangeDark1: color.special.orange, // No direct mapping
    accentOrangeLight1: color.special.orange, // No direct mapping
    accentPurple: color.secondary.s300, // Using secondary as fallback
    shadow: color.border.default,
    staticTwitterBlue: color.special.blue,
    staticWhite: color.static.white,
    staticStaticWhite: color.static.staticWhite,
    staticNeutral: color.neutral.n800,
    staticNeutralLight2: color.neutral.n600,
    staticNeutralLight8: color.neutral.n100,
    staticAccentGreenLight1: color.special.lightGreen,
    specialLightGreen: color.special.lightGreen,
    specialGreen: color.special.green,
    staticPrimary: color.static.primary,
    staticSecondary: color.secondary.s300,
    pageHeaderGradientColor1: color.special.gradientStop1,
    pageHeaderGradientColor2: color.special.gradientStop2,
    skeleton: color.neutral.n50,
    skeletonHighlight: color.neutral.n100,
    statTileText: color.secondary.s300, // Using secondary as fallback
    progressBackground: color.neutral.n200,
    accentBlue: color.special.blue,
    textIconSubdued: color.text.subdued,
    focus: color.focus.default
  }
}

export const themeColorsV2 = {
  [Theme.DEFAULT]: createMobileThemeFromHarmony(themesV2.day),
  [Theme.DARK]: createMobileThemeFromHarmony(themesV2.dark),
  [Theme.MATRIX]: createMobileThemeFromHarmony(themesV2.matrix)
}
