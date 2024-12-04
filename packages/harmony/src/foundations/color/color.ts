import { primitiveTheme } from './primitive'
import { semanticTheme } from './semantic'

export const colorTheme = {
  day: {
    ...primitiveTheme.day,
    ...semanticTheme.day
  },
  dark: {
    ...primitiveTheme.dark,
    ...semanticTheme.dark
  },
  matrix: {
    ...primitiveTheme.matrix,
    ...semanticTheme.matrix
  }
}

export type ColorTheme = typeof colorTheme
