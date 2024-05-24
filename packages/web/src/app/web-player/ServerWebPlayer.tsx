import { PropsWithChildren, ReactElement } from 'react'
import '@audius/harmony/dist/harmony.css'

import { Flex } from '@audius/harmony/src/components/layout/Flex'
import { ThemeProvider } from '@audius/harmony/src/foundations/theme/ThemeProvider'
import { StaticRouter } from 'react-router-dom'
import { PartialDeep } from 'type-fest'

import { AppState } from 'store/types'

import { ServerReduxProvider } from './ServerReduxProvider'

type ServerProviderProps = PropsWithChildren<{
  initialState: PartialDeep<AppState>
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
  children: ReactElement
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

type ServerWebPlayerProps = {
  initialState: PartialDeep<AppState>
  isMobile: boolean
  children: ReactElement
}

export const ServerWebPlayer = (props: ServerWebPlayerProps) => {
  const { initialState, isMobile, children } = props
  return (
    <ServerProviders initialState={initialState}>
      <WebPlayerContent isMobile={isMobile}>{children}</WebPlayerContent>
    </ServerProviders>
  )
}
