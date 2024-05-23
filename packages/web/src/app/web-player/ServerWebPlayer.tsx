import { PropsWithChildren, ReactNode } from 'react'

import { Flex } from '@audius/harmony/src/components/layout/Flex'
import { ThemeProvider } from '@audius/harmony/src/foundations/theme/ThemeProvider'
import { StaticRouter } from 'react-router-dom'
import { PartialDeep } from 'type-fest'

import { AppState } from 'store/types'

import { ServerReduxProvider } from './ServerReduxProvider'

type ServerProviderProps = PropsWithChildren<{
  initialState: PartialDeep<AppState>
  isMobile: boolean
}>

const ServerProviders = (props: ServerProviderProps) => {
  const { initialState, children } = props

  return (
    <ServerReduxProvider initialState={initialState}>
      <StaticRouter>
        <ThemeProvider theme='day'>{children}</ThemeProvider>
      </StaticRouter>
    </ServerReduxProvider>
  )
}

type WebPlayerContentProps = {
  children: ReactNode
  isMobile: boolean
}

const WebPlayerContent = (props: WebPlayerContentProps) => {
  const { isMobile, children } = props

  if (isMobile) {
    // TODO add header
    return children
  }

  return (
    <Flex w='100%'>
      <Flex h='100%' w={240} backgroundColor='surface1' />
      {children}
    </Flex>
  )
}

export const ServerWebPlayer = (props: ServerProviderProps) => {
  const { initialState, isMobile, children } = props
  return (
    <ServerProviders initialState={initialState}>
      <WebPlayerContent isMobile={isMobile}>{children}</WebPlayerContent>
    </ServerProviders>
  )
}
