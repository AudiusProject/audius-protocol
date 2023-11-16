// This should do nothing, just serve the page as-is

import React from 'react'

import ReactDOMServer from 'react-dom/server'
import { escapeInject, dangerouslySkipEscape } from 'vike/server'

import { PageLayout } from './PageLayout'

// See https://vike.dev/data-fetching
export const passToClient = ['pageProps']

export function render(pageContext) {
  const { Page, pageProps } = pageContext
  const pageHtml = ReactDOMServer.renderToString(
    <PageLayout>
      hi
      {/* <Page {...pageProps} /> */}
    </PageLayout>
  )

  return escapeInject`<!DOCTYPE html>
    <html>
      <body>
        <div id="page-view">${dangerouslySkipEscape(pageHtml)}</div>
      </body>
    </html>`
}
