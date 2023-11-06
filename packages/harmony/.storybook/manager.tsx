import { addons } from '@storybook/manager-api'
import { create } from '@storybook/theming/create'

import { harmonyBrandTheme } from '../src/storybook/theme'

addons.setConfig({
  theme: harmonyBrandTheme
})
