import type { Theme } from '@react-navigation/native'
import { DefaultTheme, DarkTheme } from '@react-navigation/native'

import { darkTheme, defaultTheme, matrixTheme } from 'app/utils/theme'

const defaultNavigationtTheme: Theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: defaultTheme.background,
    card: defaultTheme.white
  }
}
const darkNavigationTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: darkTheme.background,
    card: darkTheme.white
  }
}

const matrixNavigationTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: matrixTheme.background,
    card: matrixTheme.white
  }
}

export const navigationThemes = {
  default: defaultNavigationtTheme,
  dark: darkNavigationTheme,
  matrix: matrixNavigationTheme
}
