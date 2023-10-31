import { create } from '@storybook/theming/create'
import { themes as harmonyThemes } from '../src/foundations/theme'

const { day, dark, matrix } = harmonyThemes

export const lightTheme = create({
  base: 'light',

  // Color
  colorPrimary: day.color.primary.primary,
  colorSecondary: day.color.secondary.secondary,

  // UI
  appBg: day.color.background.default,
  appContentBg: day.color.background.white,
  appBorderColor: day.color.border.default,
  appBorderRadius: day.cornerRadius.m,

  // Text colors
  textColor: day.color.textIcon.default,
  textInverseColor: day.color.special.white,

  // Toolbar default and active colors
  barTextColor: '#9E9E9E',
  barSelectedColor: '#585C6D',
  barBg: day.color.background.white,

  // Form colors
  inputBg: day.color.neutral.n25,
  inputBorder: day.color.border.default,
  inputTextColor: day.color.textIcon.default,
  inputBorderRadius: day.cornerRadius.s
})

export const darkTheme = create({
  base: 'dark',

  // Color
  colorPrimary: dark.color.primary.primary,
  colorSecondary: dark.color.secondary.secondary,

  // UI
  appBg: dark.color.background.default,
  appContentBg: dark.color.background.white,
  appBorderColor: dark.color.border.default,
  appBorderRadius: dark.cornerRadius.m,

  // Text colors
  textColor: dark.color.textIcon.default,
  textInverseColor: dark.color.special.white,

  // Toolbar default and active colors
  barTextColor: '#9E9E9E',
  barSelectedColor: '#585C6D',
  barBg: dark.color.background.white,

  // Form colors
  inputBg: dark.color.neutral.n25,
  inputBorder: dark.color.border.default,
  inputTextColor: dark.color.textIcon.default,
  inputBorderRadius: dark.cornerRadius.s
})

export const matrixTheme = create({
  base: 'dark',

  // Color
  colorPrimary: matrix.color.primary.primary,
  colorSecondary: matrix.color.secondary.secondary,

  // UI
  appBg: matrix.color.background.default,
  appContentBg: matrix.color.background.white,
  appBorderColor: matrix.color.border.default,
  appBorderRadius: matrix.cornerRadius.m,

  // Text colors
  textColor: matrix.color.textIcon.default,
  textInverseColor: matrix.color.special.white,

  // Toolbar default and active colors
  barTextColor: '#9E9E9E',
  barSelectedColor: '#585C6D',
  barBg: matrix.color.background.white,

  // Form colors
  inputBg: matrix.color.neutral.n25,
  inputBorder: matrix.color.border.default,
  inputTextColor: matrix.color.textIcon.default,
  inputBorderRadius: matrix.cornerRadius.s
})

export const themes = {
  day: lightTheme,
  dark: darkTheme,
  matrix: matrixTheme
}
