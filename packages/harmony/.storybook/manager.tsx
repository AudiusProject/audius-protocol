import { addons } from '@storybook/manager-api'

import { lightTheme } from '../src/storybook/theme'

import './global.css'

addons.setConfig({
  theme: lightTheme
})
