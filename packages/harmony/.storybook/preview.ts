import {
  withThemeByDataAttribute,
  withThemeFromJSXProvider
} from '@storybook/addon-themes'
import { ComponentRules, RelatedComponents } from '../src/storybook/components'

// This file is used to configure all stories
import './global.css'
import { themes } from '../src/foundations/theme'
import { harmonyDocsThemes } from '../src/storybook/theme'
import { HarmonyDocsContainer } from './docs'
import { ThemeProvider } from '@emotion/react'

// Default to docs view
export const parameters = {
  options: {
    storySort: {
      order: [
        'Welcome',
        'Foundations',
        ['Typography', 'Color', 'Shadow', 'Corner Radius', 'Spacing', 'Motion'],
        'Buttons',
        'Inputs',
        ['TextInput', 'SelectablePill', 'PasswordInput'],
        'Layout',
        ['Box', 'Flex', 'Divider', 'Paper'],
        'Text',
        ['Text', 'TextLink'],
        'Components',
        'Icons',
        [
          'Figma Instructions',
          'Utility Icons',
          'Logos',
          'Special Icons',
          'Animated Icons',
          'Changelog'
        ]
      ]
    }
  },
  viewMode: 'docs',
  docs: {
    container: HarmonyDocsContainer,
    toc: true
  },
  darkMode: {
    light: harmonyDocsThemes.day,
    dark: harmonyDocsThemes.dark,
    classTarget: 'html'
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
