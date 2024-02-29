import { SsrPageProps } from '@audius/common/models'
import createCache from '@emotion/cache'
import { CacheProvider } from '@emotion/react'
import createEmotionServer from '@emotion/server/create-instance'
import { createMemoryHistory } from 'history'
import { renderToString } from 'react-dom/server'
import { Helmet } from 'react-helmet'
import { escapeInject, dangerouslySkipEscape } from 'vike/server'
import type { PageContextServer } from 'vike/types'

import { isMobileUserAgent } from 'utils/clientUtil'

import { Root } from '../Root'

import { SsrContextProvider } from './SsrContext'
import { getIndexHtml } from './getIndexHtml'

const cache = createCache({ key: 'harmony', prepend: true })
const { extractCriticalToChunks, constructStyleTagsFromChunks } =
  createEmotionServer(cache)

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

  const pageHtml = renderToString(
    <CacheProvider value={cache}>
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
    </CacheProvider>
  )
  const helmet = Helmet.renderStatic()
  const chunks = extractCriticalToChunks(pageHtml)
  const styles = constructStyleTagsFromChunks(chunks)

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
    .replace(
      `<style id="emotion"></style>`,
      `
      ${styles}
      `
    )

  return escapeInject`${dangerouslySkipEscape(html)}`
}
