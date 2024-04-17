import { SsrPageProps } from '@audius/common/models'
import createEmotionServer from '@emotion/server/create-instance'
// import { createMemoryHistory } from 'history'
import { renderToString } from 'react-dom/server'
import { Helmet } from 'react-helmet'
import { escapeInject, dangerouslySkipEscape } from 'vike/server'
import type { PageContextServer } from 'vike/types'

// import { isMobileUserAgent } from 'utils/clientUtil'

import { harmonyCache } from '../HarmonyCacheProvider'

// import RootWithProviders from './RootWithProviders'
import { getIndexHtml } from './getIndexHtml'

const { extractCriticalToChunks, constructStyleTagsFromChunks } =
  createEmotionServer(harmonyCache)

export default function render(
  _pageContext: PageContextServer & {
    pageProps: SsrPageProps
    userAgent: string
  }
) {
  // const { pageProps, urlPathname } = pageContext
  //
  // const isMobile = isMobileUserAgent(pageContext.userAgent)
  //
  // const history = createMemoryHistory({
  //   initialEntries: [urlPathname]
  // })

  const pageHtml = renderToString(<p>Hello, World!</p>)
  // const pageHtml = renderToString(
  //   <RootWithProviders
  //     ssrContextValue={{
  //       isServerSide: true,
  //       isSsrEnabled: true,
  //       pageProps,
  //       history,
  //       isMobile
  //     }}
  //   />
  // )

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
