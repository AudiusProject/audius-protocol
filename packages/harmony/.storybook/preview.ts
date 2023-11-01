import {
  withThemeByDataAttribute,
  withThemeFromJSXProvider
} from '@storybook/addon-themes'
import { ComponentRules, RelatedComponents } from '../src/storybook/components'

// This file is used to configure all stories
import './global.css'
import 'foundations/reset/reset.css'
import 'foundations/typography/avenir.css'
import 'foundations/typography/fonts.css'
import 'foundations/spacing/spacing.css'
import 'foundations/color/primitive.css'
import 'foundations/color/semantic.css'
import 'foundations/motion/motion.css'
import 'foundations/corner-radius/corner-radius.css'
import 'foundations/shadows/shadows.css'
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
