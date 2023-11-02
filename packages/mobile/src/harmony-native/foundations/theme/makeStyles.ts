import { useContext } from 'react'

import { StyleSheet } from 'react-native'
import type { ImageStyle, TextStyle, ViewStyle } from 'react-native'

import { ThemeContext } from './ThemeProvider'
import type { HarmonyTheme } from './theme'
import { darkTheme, dayTheme, matrixTheme } from './theme'

export type NamedStyles<T> = {
  [P in keyof T]:
    | ViewStyle
    | TextStyle
    | ImageStyle
    | (ViewStyle & { fill: string }) // For SVGs
}

export const makeStyles = <T extends NamedStyles<T> | NamedStyles<any>>(
  styles: (theme: HarmonyTheme) => T | NamedStyles<T>
) => {
  const harmonyStylesheets = {
    day: StyleSheet.create(styles(dayTheme)),
    dark: StyleSheet.create(styles(darkTheme)),
    matrix: StyleSheet.create(styles(matrixTheme))
  }

  return function useStyles() {
    const { theme } = useContext(ThemeContext)
    return harmonyStylesheets[theme]
  }
}
