import React from 'react'
import { harmonyDocsThemes } from '../src/storybook/theme'
import { DocsContainer, DocsContainerProps } from '@storybook/addon-docs'
import { useDarkMode } from 'storybook-dark-mode'
import { ThemeProvider } from '../src/foundations/theme'

export const HarmonyDocsContainer = (props: DocsContainerProps) => {
  // @ts-ignore globals are available
  const currentTheme = props.context.store.globals.globals.theme || 'day'

  return (
    <ThemeProvider theme={currentTheme}>
      <DocsContainer {...props} theme={harmonyDocsThemes[currentTheme]} />
    </ThemeProvider>
  )
}
