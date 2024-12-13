import { useFeatureFlag } from '@audius/common/hooks'
import { Theme } from '@audius/common/models'
import { FeatureFlags } from '@audius/common/services'

import type { ThemeColors } from 'app/utils/theme'
import {
  useThemeVariant,
  darkTheme,
  matrixTheme,
  defaultTheme
} from 'app/utils/theme'
import { themeColorsV2 } from 'app/utils/themeV2'

type AnimationCreatorConfig = { palette: ThemeColors; type: Theme }

export const makeAnimations = <TReturn>(
  animationCreator: (config: AnimationCreatorConfig) => TReturn
) => {
  const themedAnimations = {
    [Theme.DEFAULT]: animationCreator({
      palette: defaultTheme,
      type: Theme.DEFAULT
    }),
    [Theme.DARK]: animationCreator({
      palette: darkTheme,
      type: Theme.DARK
    }),
    [Theme.MATRIX]: animationCreator({
      palette: matrixTheme,
      type: Theme.MATRIX
    })
  }

  const themedAnimationsV2 = {
    [Theme.DEFAULT]: animationCreator({
      palette: themeColorsV2[Theme.DEFAULT],
      type: Theme.DEFAULT
    }),
    [Theme.DARK]: animationCreator({
      palette: themeColorsV2[Theme.DARK],
      type: Theme.DARK
    }),
    [Theme.MATRIX]: animationCreator({
      palette: themeColorsV2[Theme.MATRIX],
      type: Theme.MATRIX
    })
  }

  return function useAnimations(): TReturn {
    const themeVariant = useThemeVariant()
    const { isEnabled: isThemeV2Enabled } = useFeatureFlag(
      FeatureFlags.THEME_V2
    )

    return isThemeV2Enabled
      ? themedAnimationsV2[themeVariant]
      : themedAnimations[themeVariant]
  }
}
