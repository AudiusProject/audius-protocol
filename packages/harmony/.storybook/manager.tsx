import { addons } from '@storybook/manager-api'

import { harmonyDocsThemes } from '../src/storybook/theme'

import './global.css'

addons.setConfig({
  theme: harmonyDocsThemes.day
})
