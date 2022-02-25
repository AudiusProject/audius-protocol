import { DefaultTheme, DarkTheme, Theme } from '@react-navigation/native'

import { darkTheme, defaultTheme, matrixTheme } from 'app/utils/theme'

const defaultNavigationtTheme: Theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: defaultTheme.background
  }
}
const darkNavigationTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: darkTheme.background
  }
}

const matrixNavigationTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: matrixTheme.background
  }
}

export const navigationThemes = {
  default: defaultNavigationtTheme,
  dark: darkNavigationTheme,
  matrix: matrixNavigationTheme
}
