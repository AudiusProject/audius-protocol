import { create } from '@storybook/theming/create'

import HarmonyLogo from '../assets/harmonyLogo.png'

import { primitives } from './colors'

export const harmonyBrandTheme = create({
  base: 'light',

  // typography
  fontBase: '"Open Sans", sans-serif',
  fontCode: 'monospace',

  brandTitle: 'Harmony Design',
  brandUrl: 'harmony.audius.co',
  brandImage: HarmonyLogo,
  brandTarget: '_self',

  textColor: primitives.neutral.N400,
  textMutedColor: primitives.neutral.N300,
  textInverseColor: primitives.neutral.N050,
  colorPrimary: primitives.primary.V400,
  colorSecondary: primitives.primary.V300,
  appBg: primitives.primary.V050,
  appContentBg: primitives.neutral.N050,
  appBorderColor: primitives.neutral.N200,
  barTextColor: primitives.primary.V600,
  barSelectedColor: primitives.primary.V600,
  barBg: primitives.primary.V050,
  inputBg: primitives.neutral.N050,
  inputBorder: primitives.neutral.N200,
  inputTextColor: primitives.neutral.N400
})
