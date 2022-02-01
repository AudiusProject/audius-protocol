import { useContext } from 'react'

import { StyleSheet, TextStyle, ViewStyle, ImageStyle } from 'react-native'

import { ThemeContext } from '../components/theme/ThemeContext'
import { ThemeColors, useThemeColors } from '../utils/theme'

import { spacing } from './spacing'
import { typography } from './typography'

type Theme = {
  palette: ThemeColors
  typography: typeof typography
  spacing: typeof spacing
}

type NamedStyles<T> = { [P in keyof T]: ViewStyle | TextStyle | ImageStyle }

type Styles<T extends NamedStyles<T>> = (theme: Theme) => T | NamedStyles<T>

export const makeStyles = <T extends NamedStyles<T> | NamedStyles<any>>(
  styles: Styles<T>
) => {
  const useStyles = (): T => {
    const { getTheme } = useContext(ThemeContext)
    const themeMode = getTheme()
    const themeColors = useThemeColors()
    const palette = { mode: themeMode, ...themeColors }
    const theme: Theme = { palette, typography, spacing }
    const namedStyles = styles(theme)
    return StyleSheet.create(namedStyles)
  }
  return useStyles
}
