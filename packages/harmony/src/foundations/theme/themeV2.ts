import type { ColorThemeV2 } from '../color/colorV2'
import { colorThemeV2 } from '../color/colorV2'
import { CornerRadius, cornerRadius } from '../corner-radius'
import { Motion, motion, Spring, spring } from '../motion'
import { Shadows, shadows } from '../shadows'
import { Spacing, spacing, iconSizes } from '../spacing'
import { typography } from '../typography'
import type { Typography } from '../typography'

import type { Theme } from './types'

const commonFoundations = {
  shadows,
  typography,
  cornerRadius,
  spacing,
  motion,
  spring,
  iconSizes
}

export type HarmonyThemeV2 = {
  type: Theme
  color: ColorThemeV2[keyof ColorThemeV2]
  shadows: Shadows
  typography: Typography
  cornerRadius: CornerRadius
  spacing: Spacing
  motion: Motion
  spring: Spring
  iconSizes: typeof iconSizes
}

export const dayThemeV2: HarmonyThemeV2 = {
  type: 'day',
  color: colorThemeV2.day,
  ...commonFoundations
}

export const darkThemeV2: HarmonyThemeV2 = {
  type: 'dark',
  color: colorThemeV2.dark,
  ...commonFoundations
}

export const matrixThemeV2: HarmonyThemeV2 = {
  type: 'matrix',
  color: colorThemeV2.matrix,
  ...commonFoundations
}

export const themesV2 = {
  day: dayThemeV2,
  dark: darkThemeV2,
  matrix: matrixThemeV2
}
