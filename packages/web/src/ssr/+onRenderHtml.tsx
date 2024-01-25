import { SsrPageProps } from '@audius/common'
import { createMemoryHistory } from 'history'
import ReactDOMServer from 'react-dom/server'
import { Helmet } from 'react-helmet'
import { escapeInject, dangerouslySkipEscape } from 'vike/server'
import type { PageContextServer } from 'vike/types'

import { isMobileUserAgent } from 'utils/clientUtil'

import { Root } from '../Root'

import { SsrContextProvider } from './SsrContext'
import { getIndexHtml } from './getIndexHtml'

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
        isServerSide: true,
        isSsrEnabled: true,
        pageProps,
        history,
        isMobile
      }}
    >
      <Root />
    </SsrContextProvider>
  )
  const helmet = Helmet.renderStatic()

  const html = getIndexHtml()
    .replace(`<div id="root"></div>`, `<div id="root">${pageHtml}</div>`)
    .replace(
      `<meta property="helmet" />`,
      `
      ${helmet.title.toString()}
      ${helmet.meta.toString()}
      ${helmet.link.toString()}
      `
    )

  return escapeInject`${dangerouslySkipEscape(html)}`
}
