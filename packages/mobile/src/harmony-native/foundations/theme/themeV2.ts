import { colorThemeV2 } from '../color/colorV2'

import { theme } from './theme'

export const themeV2 = {
  day: {
    ...theme.day,
    color: colorThemeV2.day
  },
  dark: {
    ...theme.dark,
    color: colorThemeV2.dark
  },
  matrix: {
    ...theme.matrix,
    color: colorThemeV2.matrix
  }
}
