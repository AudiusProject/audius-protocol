import type { ColorTheme } from '../color'
import { colorTheme } from '../color'
import type { Theme } from '../types'
import type { Typography } from '../typography'
import { typography } from '../typography'

export type HarmonyTheme = {
  type: Theme
  color: ColorTheme[keyof ColorTheme]
  typography: Typography
}

export const dayTheme: HarmonyTheme = {
  type: 'day',
  color: colorTheme.day,
  typography
}

export const darkTheme: HarmonyTheme = {
  type: 'dark',
  color: colorTheme.dark,
  typography
}

export const matrixTheme: HarmonyTheme = {
  type: 'matrix',
  color: colorTheme.matrix,
  typography
}
