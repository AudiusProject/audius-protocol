import { primitiveThemeV2 } from './primitiveV2'
import { semanticThemeV2 } from './semanticV2'

export const colorThemeV2 = {
  day: {
    ...primitiveThemeV2.day,
    ...semanticThemeV2.day
  },
  dark: {
    ...primitiveThemeV2.dark,
    ...semanticThemeV2.dark
  },
  matrix: {
    ...primitiveThemeV2.matrix,
    ...semanticThemeV2.matrix
  }
}

export type ColorThemeV2 = typeof colorThemeV2
