import { SsrPageProps } from '@audius/common'
import { createMemoryHistory } from 'history'
import ReactDOMServer from 'react-dom/server'
import { escapeInject, dangerouslySkipEscape } from 'vike/server'
import { PageContextServer } from 'vike/types'

import { isMobileUserAgent } from 'utils/clientUtil'

import { Root } from '../Root'

import { SsrContextProvider } from './SsrContext'
import { getIndexHtml } from './getIndexHtml'

export const passToClient = ['pageProps', 'urlPathname']

export default function render(
  pageContext: PageContextServer & {
    pageProps: SsrPageProps
    userAgent: string
  }
) {
  const { pageProps, urlPathname } = pageContext

  const isMobile = isMobileUserAgent(pageContext.userAgent)

  const history = createMemoryHistory({
    initialEntries: [urlPathname]
  })

  const pageHtml = ReactDOMServer.renderToString(
    <SsrContextProvider
      value={{
        path: urlPathname,
        isServerSide: true,
        pageProps,
        history,
        isMobile
      }}
    >
      <Root />
    </SsrContextProvider>
  )

  const html = getIndexHtml().replace(
    `<div id="root"></div>`,
    `<div id="root">${pageHtml}</div>`
  )

  return escapeInject`${dangerouslySkipEscape(html)}`
}
