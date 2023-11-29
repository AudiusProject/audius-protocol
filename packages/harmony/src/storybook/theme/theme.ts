import { create } from '@storybook/theming/create'

import HarmonyLogo from '../assets/harmonyLogo.png'
import HarmonyLogoDark from '../assets/harmonyLogoDark.png'

import { primitives } from './colors'

const dayTheme = create({
  base: 'light',

  // typography
  fontBase: '"Open Sans", sans-serif',
  fontCode: 'monospace',

  brandTitle: 'Harmony Design',
  brandUrl: '/',
  brandImage: HarmonyLogo,
  brandTarget: '_self',

  textColor: primitives.neutral.N800,
  textMutedColor: primitives.neutral.N600,
  textInverseColor: primitives.neutral.N050,
  colorPrimary: primitives.primary.V400,
  colorSecondary: primitives.primary.V400,
  appBg: primitives.primary.V050,
  appContentBg: primitives.neutral.N050,
  appBorderColor: primitives.neutral.N300,
  barTextColor: primitives.primary.V600,
  barSelectedColor: primitives.primary.V400,
  barBg: primitives.neutral.N050,
  inputBg: primitives.neutral.N050,
  inputBorder: primitives.neutral.N200,
  inputTextColor: primitives.neutral.N800
})

const darkTheme = create({
  base: 'dark',

  // typography
  fontBase: '"Open Sans", sans-serif',
  fontCode: 'monospace',

  brandTitle: 'Harmony Design',
  brandUrl: '/',
  brandImage: HarmonyLogoDark,
  brandTarget: '_self',

  textColor: primitives.neutral.N050,
  textMutedColor: primitives.neutral.N200,
  textInverseColor: primitives.neutral.N800,
  colorPrimary: primitives.primary.V300,
  colorSecondary: primitives.primary.V300,
  appBg: primitives.primary.V600,
  appContentBg: primitives.neutral.N800,
  appBorderColor: primitives.neutral.N500,
  barTextColor: primitives.primary.V050,
  barSelectedColor: primitives.primary.V300,
  barBg: primitives.neutral.N800,
  inputBg: primitives.neutral.N500,
  inputBorder: primitives.neutral.N600,
  inputTextColor: primitives.neutral.N050
})

export const harmonyDocsThemes = {
  day: dayTheme,
  dark: darkTheme,
  matrix: darkTheme
}
