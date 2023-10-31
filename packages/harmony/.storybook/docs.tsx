import React from 'react'
import { themes } from './theme'
import { DocsContainer, DocsContainerProps } from '@storybook/addon-docs'

export const HarmonyDocsContainer = (props: DocsContainerProps) => {
  // @ts-ignore globals are available
  const currentTheme = props.context.store.globals.globals.theme

  return <DocsContainer {...props} theme={themes[currentTheme]} />
}
