import {
  withThemeByDataAttribute,
  withThemeFromJSXProvider
} from '@storybook/addon-themes'
import { ComponentRules, RelatedComponents } from '../src/storybook/components'

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
import { darkTheme, lightTheme } from './theme'
import { themes } from '../src/foundations/theme'
import { HarmonyDocsContainer } from './docs'
import { ThemeProvider } from '@emotion/react'

// Default to docs view
export const parameters = {
  viewMode: 'docs',
  darkMode: {
    light: lightTheme,
    dark: darkTheme
  },
  docs: {
    container: HarmonyDocsContainer,
    toc: true,
    components: {
      ComponentRules,
      RelatedComponents
    }
  }
}

export const decorators = [
  withThemeByDataAttribute({
    themes: {
      day: 'day',
      dark: 'dark',
      matrix: 'matrix'
    },
    defaultTheme: 'day',
    attributeName: 'data-theme'
  }),
  withThemeFromJSXProvider({
    themes,
    defaultTheme: 'day',
    Provider: ThemeProvider
  })
]
