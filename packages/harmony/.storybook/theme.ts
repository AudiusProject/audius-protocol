import { create } from '@storybook/theming/create'
import { themeColorsMap } from '../src/styles/theme'

const { day, dark, matrix } = themeColorsMap

export const lightTheme = create({
  base: 'light',

  // Color
  colorPrimary: day.primary.primary,
  colorSecondary: day.secondary.secondary,

  // UI
  appBg: day.special.background,
  appContentBg: day.special.white,
  appBorderColor: day.neutral.n100,
  appBorderRadius: 8,

  // Text colors
  textColor: day.neutral.neutral,
  textInverseColor: day.special.white,

  // Toolbar default and active colors
  barTextColor: '#9E9E9E',
  barSelectedColor: '#585C6D',
  barBg: day.special.white,

  // Form colors
  inputBg: day.neutral.n25,
  inputBorder: day.neutral.n100,
  inputTextColor: day.neutral.neutral,
  inputBorderRadius: 4
})

export const darkTheme = create({
  base: 'dark',

  // Color
  colorPrimary: dark.primary.primary,
  colorSecondary: dark.secondary.secondary,

  // UI
  appBg: dark.special.background,
  appContentBg: dark.special.white,
  appBorderColor: dark.neutral.n100,
  appBorderRadius: 8,

  // Text colors
  textColor: dark.neutral.neutral,
  textInverseColor: dark.special.white,

  // Toolbar default and active colors
  barTextColor: '#9E9E9E',
  barSelectedColor: '#585C6D',
  barBg: dark.special.white,

  // Form colors
  inputBg: dark.neutral.n25,
  inputBorder: dark.neutral.n100,
  inputTextColor: dark.neutral.neutral,
  inputBorderRadius: 4
})

export const matrixTheme = create({
  base: 'dark',

  // Color
  colorPrimary: matrix.primary.primary,
  colorSecondary: matrix.secondary.secondary,

  // UI
  appBg: matrix.special.background,
  appContentBg: matrix.special.white,
  appBorderColor: matrix.neutral.n100,
  appBorderRadius: 8,

  // Text colors
  textColor: matrix.neutral.neutral,
  textInverseColor: matrix.special.white,

  // Toolbar default and active colors
  barTextColor: '#9E9E9E',
  barSelectedColor: '#585C6D',
  barBg: matrix.special.white,

  // Form colors
  inputBg: matrix.neutral.n25,
  inputBorder: matrix.neutral.n100,
  inputTextColor: matrix.neutral.neutral,
  inputBorderRadius: 4
})

export const themes = {
  day: lightTheme,
  dark: darkTheme,
  matrix: matrixTheme
}
