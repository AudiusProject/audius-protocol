import React from 'react'
import { DocsContainer, DocsContainerProps } from '@storybook/addon-docs'
import { ThemeProvider } from '../src/foundations/theme'

export const HarmonyDocsContainer = (props: DocsContainerProps) => {
  // @ts-ignore globals are available
  const currentTheme = props.context.store.globals.globals.theme || 'day'

  return (
    <ThemeProvider theme={currentTheme}>
      <DocsContainer {...props} />
    </ThemeProvider>
  )
}
