import { useEffect, useMemo, useRef } from 'react'

import { isEqual } from 'lodash'
import hash from 'object-hash'
import type { TextStyle, ViewStyle, ImageStyle } from 'react-native'
import { StyleSheet } from 'react-native'

import type { ThemeColors, Theme as ThemeType } from '../utils/theme'
import { useThemeVariant, useThemeColors } from '../utils/theme'

import { spacing } from './spacing'
import { typography } from './typography'

const useMemoCompare = <Next>(
  next: Next,
  compare: (a?: Next, b?: Next) => boolean
): Next => {
  const previousRef = useRef<Next | undefined>()
  const previous = previousRef.current

  // Pass previous and next value to compare function
  // to determine whether to consider them equal.
  const isEqual = compare(previous, next)

  // If not equal update previousRef to next value.
  // We only update if not equal so that this hook continues to return
  // the same old value if compare keeps returning true.
  useEffect(() => {
    if (!isEqual) {
      previousRef.current = next
    }
  })

  // Finally, if equal then return the previous value
  // Note: isEqual == 'true' implies previous is type Next
  return isEqual ? (previous as Next) : next
}

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

const styleCache = {}

export const makeStyles = <PropsT, T extends NamedStyles<T> = NamedStyles<any>>(
  styles: Styles<T, PropsT>
) => {
  const useStyles = (props?: PropsT): T => {
    const themeVariant = useThemeVariant()
    const palette = useThemeColors()

    const memoizedProps = useMemoCompare<PropsT | undefined>(props, isEqual)

    const stylesheet = useMemo(() => {
      const theme = { palette, typography, spacing, type: themeVariant }
      const namedStyles = styles(theme, memoizedProps)
      const namedStylesHash = hash(namedStyles)
      const cachedStyle = styleCache[namedStylesHash]
      if (cachedStyle) {
        return cachedStyle
      }
      const stylesheet = StyleSheet.create(namedStyles)
      styleCache[namedStylesHash] = stylesheet
      return stylesheet
    }, [palette, themeVariant, memoizedProps])

    return stylesheet
  }

  return useStyles
}
