import React, { useEffect } from 'react'
import { harmonyDocsThemes } from '../src/storybook/theme'
import { DocsContainer, DocsContainerProps } from '@storybook/addon-docs'
import { ThemeProvider } from '../src/foundations/theme'
import { addons } from '@storybook/preview-api'
import { UPDATE_DARK_MODE_EVENT_NAME, useDarkMode } from 'storybook-dark-mode'

export const HarmonyDocsContainer = (props: DocsContainerProps) => {
  // @ts-ignore globals are available
  const currentTheme = props.context.store.globals.globals.theme || 'day'
  const isDark = useDarkMode()

  useEffect(() => {
    if (isDark && currentTheme === 'day') {
      addons.getChannel().emit(UPDATE_DARK_MODE_EVENT_NAME)
    } else if (!isDark && currentTheme !== 'day') {
      addons.getChannel().emit(UPDATE_DARK_MODE_EVENT_NAME)
    }
  }, [currentTheme])

  return (
    <div id='harmony-root' data-theme={currentTheme}>
      <ThemeProvider theme={currentTheme}>
        <DocsContainer {...props} theme={harmonyDocsThemes[currentTheme]} />
      </ThemeProvider>
    </div>
  )
}
