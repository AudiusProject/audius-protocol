import { PropsWithChildren, ReactElement } from 'react'
import '@audius/harmony/dist/harmony.css'

import { Box } from '@audius/harmony/src/components/layout/Box'
import { Flex } from '@audius/harmony/src/components/layout/Flex'
import { ThemeProvider } from '@audius/harmony/src/foundations/theme/ThemeProvider'
import { StaticRouter } from 'react-router-dom'
import { PartialDeep } from 'type-fest'

import { SsrContextProvider } from 'ssr/SsrContext'
import { AppState } from 'store/types'

import { ServerReduxProvider } from './ServerReduxProvider'

type ServerProviderProps = PropsWithChildren<{
  initialState: PartialDeep<AppState>
  isMobile: boolean
}>

const ServerProviders = (props: ServerProviderProps) => {
  const { initialState, isMobile, children } = props

  return (
    <ServerReduxProvider initialState={initialState}>
      <StaticRouter>
        <SsrContextProvider
          value={{
            isMobile,
            isServerSide: true,
            isSsrEnabled: true
          }}
        >
          <ThemeProvider theme='day'>{children}</ThemeProvider>
        </SsrContextProvider>
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
    return (
      <Flex direction='column' w='100%' backgroundColor='default'>
        <Flex h={40} w='100%' backgroundColor='white' />
        <Box pb={50}>{children}</Box>
        <Flex
          h={50}
          w='100%'
          backgroundColor='surface1'
          css={{ position: 'fixed', bottom: 0, zIndex: 1 }}
        />
      </Flex>
    )
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
    <ServerProviders initialState={initialState} isMobile={isMobile}>
      <WebPlayerContent isMobile={isMobile}>{children}</WebPlayerContent>
    </ServerProviders>
  )
}
