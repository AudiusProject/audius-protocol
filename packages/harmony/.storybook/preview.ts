import {
  withThemeByDataAttribute,
  withThemeFromJSXProvider
} from '@storybook/addon-themes'
import { ComponentRules, RelatedComponents } from '../src/storybook/components'

// This file is used to configure all stories
import './global.css'
import { themes } from '../src/foundations/theme'
import { HarmonyDocsContainer } from './docs'
import { ThemeProvider } from '@emotion/react'

// Default to docs view
export const parameters = {
  viewMode: 'docs',
  enableShortcuts: false,
  docs: {
    container: HarmonyDocsContainer,
    toc: true,
    components: {
      ComponentRules,
      RelatedComponents
    }
  },
  options: {
    enableShortcuts: false
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
