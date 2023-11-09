import {
  withThemeByDataAttribute,
  withThemeFromJSXProvider
} from '@storybook/addon-themes'

// This file is used to configure all stories
import './global.css'
import { themes } from '../src/foundations/theme'
import { harmonyDocsThemes } from '../src/storybook/theme'
import { HarmonyDocsContainer } from './docs'
import { ThemeProvider } from '@emotion/react'

// Default to docs view
export const parameters = {
  viewMode: 'docs',
  docs: {
    container: HarmonyDocsContainer,
    toc: true,
    components: {
      // ComponentRules,
      // RelatedComponents
    }
  },
  darkMode: {
    light: harmonyDocsThemes.day,
    dark: harmonyDocsThemes.dark,
    stylePreview: true
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
