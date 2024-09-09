import { Theme } from '@audius/common/models'

import type { ThemeColors } from 'app/utils/theme'
import {
  useThemeVariant,
  darkTheme,
  matrixTheme,
  defaultTheme,
  debugTheme
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
    }),
    [Theme.DEBUG]: animationCreator({
      palette: debugTheme,
      type: Theme.DEBUG
    })
  }

  return function useAnimations(): TReturn {
    const themeVariant = useThemeVariant()
    return themedAnimations[themeVariant]
  }
}
