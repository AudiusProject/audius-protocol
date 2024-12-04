import { useFeatureFlag } from '@audius/common/hooks'
import { Theme } from '@audius/common/models'
import { FeatureFlags } from '@audius/common/services'
import type { ImageStyle, TextStyle, ViewStyle } from 'react-native'
import { StyleSheet } from 'react-native'

import type { ThemeColors } from 'app/utils/theme'
import {
  matrixTheme,
  defaultTheme,
  darkTheme,
  useThemeVariant
} from 'app/utils/theme'
import { themeColorsV2 } from 'app/utils/themeV2'

import { spacing } from './spacing'
import { typography } from './typography'

type StylesOptions = {
  palette: ThemeColors
  typography: typeof typography
  spacing: typeof spacing
  type: Theme
}

type StyleTypes =
  | ImageStyle
  | ViewStyle
  | TextStyle
  | (ViewStyle & { fill: string })

export const makeStyles = <T extends Record<string, StyleTypes>>(
  styles: (options: StylesOptions) => T
): (() => T) => {
  const baseOptions = { spacing, typography }

  const defaultStylesheet = StyleSheet.create(
    styles({
      type: Theme.DEFAULT,
      palette: defaultTheme,
      ...baseOptions
    })
  )

  const darkStylesheet = StyleSheet.create(
    styles({
      type: Theme.DARK,
      palette: darkTheme,
      ...baseOptions
    })
  )

  const matrixStylesheet = StyleSheet.create(
    styles({
      type: Theme.MATRIX,
      palette: matrixTheme,
      ...baseOptions
    })
  )

  const defaultStylesheetV2 = StyleSheet.create(
    styles({
      type: Theme.DEFAULT,
      palette: themeColorsV2[Theme.DEFAULT],
      ...baseOptions
    })
  )

  const darkStylesheetV2 = StyleSheet.create(
    styles({
      type: Theme.DARK,
      palette: themeColorsV2[Theme.DARK],
      ...baseOptions
    })
  )

  const matrixStylesheetV2 = StyleSheet.create(
    styles({
      type: Theme.MATRIX,
      palette: themeColorsV2[Theme.MATRIX],
      ...baseOptions
    })
  )

  const themedStylesheets = {
    [Theme.DEFAULT]: defaultStylesheet,
    [Theme.DARK]: darkStylesheet,
    [Theme.MATRIX]: matrixStylesheet
  }

  const themedStylesheetsV2 = {
    [Theme.DEFAULT]: defaultStylesheetV2,
    [Theme.DARK]: darkStylesheetV2,
    [Theme.MATRIX]: matrixStylesheetV2
  }

  return function useStyles() {
    const themeVariant = useThemeVariant()
    const { isEnabled: isThemeV2Enabled } = useFeatureFlag(
      FeatureFlags.THEME_V2
    )

    return isThemeV2Enabled
      ? themedStylesheetsV2[themeVariant]
      : themedStylesheets[themeVariant]
  }
}
