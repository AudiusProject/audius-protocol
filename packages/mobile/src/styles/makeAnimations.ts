import { Theme } from '@audius/common/models'

import type { ThemeColors } from 'app/utils/theme'
import {
  useThemeVariant,
  darkTheme,
  matrixTheme,
  defaultTheme
} from 'app/utils/theme'

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

  return function useAnimations(): TReturn {
    const themeVariant = useThemeVariant()
    return themedAnimations[themeVariant]
  }
}
