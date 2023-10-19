import { withThemeByDataAttribute } from '@storybook/addon-themes'

// This file is used to configure all stories
import './global.css'
import 'assets/styles/reset.css'
import 'assets/fonts/avenir.css'
import 'assets/styles/fonts.css'
import 'assets/styles/spacing.css'
import 'assets/styles/colors.css'
import 'assets/styles/tokens.css'
import 'assets/styles/animations.css'
import 'assets/styles/border-radius.css'
import 'assets/styles/shadows.css'

// Default to docs view
export const parameters = {
  viewMode: 'docs'
}

export const decorators = [
  withThemeByDataAttribute({
    themes: {
      default: 'default',
      dark: 'dark',
      matrix: 'matrix'
    },
    defaultTheme: 'default',
    attributeName: 'data-theme'
  })
]
