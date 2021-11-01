import { useMemo } from 'react'
import { StyleSheet } from 'react-native'

import { ThemeColors as _ThemeColors, useThemeColors } from '../utils/theme'

export type ThemeColors = _ThemeColors

/**
 * This hook will return the result of passing the currently selected theme colors
 * to the provided createStyles function
 * @param createStyles A function accepting ThemeColors and returning a StyleSheet
 * @returns StyleSheet
 *
 * Example:
 *
 * const createStyles = (themeColors: ThemeColors) =>
 *   StyleSheet.create({
 *     view: {
 *       color: themeColors.neutralLight4,
 *     },
 *   })
 *
 *
 * const styles = useThemedStyles(createStyles)
 */
export const useThemedStyles = <T>(
  createStyles: (themeColors: _ThemeColors) => StyleSheet.NamedStyles<T>
) => {
  const themeColors = useThemeColors()
  return useMemo(() => createStyles(themeColors), [createStyles, themeColors])
}
