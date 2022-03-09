import { useContext } from 'react'

import { StyleSheet, TextStyle, ViewStyle, ImageStyle } from 'react-native'

import { ThemeContext } from '../components/theme/ThemeContext'
import { Theme as ThemeType, ThemeColors, useThemeColors } from '../utils/theme'

import { spacing } from './spacing'
import { typography } from './typography'

type Theme = {
  palette: ThemeColors
  typography: typeof typography
  spacing: typeof spacing
  type: ThemeType
}

type NamedStyles<T> = { [P in keyof T]: ViewStyle | TextStyle | ImageStyle }

type Styles<T extends NamedStyles<T>, PropsT> = (
  theme: Theme,
  props?: PropsT
) => T | NamedStyles<T>

export const makeStyles = <T extends NamedStyles<T> | NamedStyles<any>, PropsT>(
  styles: Styles<T, PropsT>
) => {
  const useStyles = (props?: PropsT): T => {
    const { theme: themeType, isSystemDarkMode } = useContext(ThemeContext)
    const type =
      themeType === ThemeType.AUTO
        ? isSystemDarkMode
          ? ThemeType.DARK
          : ThemeType.DEFAULT
        : themeType
    const palette = useThemeColors()
    const theme: Theme = { palette, typography, spacing, type }
    const namedStyles = styles(theme, props)
    return StyleSheet.create(namedStyles)
  }
  return useStyles
}
