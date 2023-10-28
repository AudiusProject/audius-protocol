import { addons } from '@storybook/manager-api'
import { create } from '@storybook/theming/create'
import logo from './public/logo.png'

export const theme = create({
  base: 'light',

  // typography
  fontBase: '"Open Sans", sans-serif',
  fontCode: 'monospace',

  brandTitle: 'Harmony Design',
  brandUrl: 'harmony.audius.co',
  brandImage: logo,
  brandTarget: '_self'
})

addons.setConfig({ theme })
