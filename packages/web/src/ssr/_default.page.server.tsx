import { Track } from '@audius/sdk'
import ReactDOMServer from 'react-dom/server'
import { escapeInject, dangerouslySkipEscape } from 'vike/server'
import { PageContextServer } from 'vike/types'

import { WebPlayerSkeleton } from './WebPlayerSkeleton'

export const passToClient = ['pageProps']

export function render(
  pageContext: PageContextServer & { pageProps: { track: Track } }
) {
  const { Page, pageProps } = pageContext
  const pageHtml = ReactDOMServer.renderToString(
    <WebPlayerSkeleton>
      <Page {...pageProps} />
    </WebPlayerSkeleton>
  )

  // TODO: this needs to be index.html
  return escapeInject`<!DOCTYPE html>
    <html>
      <body>
        <div id="page-view">${dangerouslySkipEscape(pageHtml)}</div>
      </body>
    </html>`
}
