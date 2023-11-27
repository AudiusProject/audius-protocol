import { Track } from '@audius/sdk'
import ReactDOMServer from 'react-dom/server'
import { escapeInject, dangerouslySkipEscape } from 'vike/server'
import { PageContextServer } from 'vike/types'

import history from 'utils/history'

import { Root } from '../Root'

import { SsrContextProvider } from './SsrContext'
import { SsrRoot } from './SsrRoot'
import { WebPlayerSkeleton } from './WebPlayerSkeleton'

export const passToClient = ['pageProps', 'urlPathname']

export function render(
  pageContext: PageContextServer & { pageProps: { track: Track } }
) {
  const { Page, pageProps, urlPathname } = pageContext

  history.replace(urlPathname)

  const pageHtml = ReactDOMServer.renderToString(
    <SsrContextProvider value={{ path: urlPathname, isServerSide: true }}>
      <Root />
    </SsrContextProvider>
  )

  // TODO: this needs to be index.html
  // TODO: env vars?
  return escapeInject`<!DOCTYPE html>
    <html>
      <body>
        <div id="root">${dangerouslySkipEscape(pageHtml)}</div>
      </body>
    </html>`
}
