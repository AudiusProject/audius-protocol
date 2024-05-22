import { SsrPageProps } from '@audius/common/models'
import createEmotionServer from '@emotion/server/create-instance'
import { createMemoryHistory } from 'history'
import { renderToString } from 'react-dom/server'
import { Helmet } from 'react-helmet'
import { escapeInject, dangerouslySkipEscape } from 'vike/server'
import type { PageContextServer } from 'vike/types'

import { ServerWebPlayer } from 'app/web-player/ServerWebPlayer'
import { ServerCollectionPage } from 'pages/server-collection-page/ServerCollectionPage'
import { isMobileUserAgent } from 'utils/clientUtil'
import { getCollectionPageSEOFields } from 'utils/seo'

import { harmonyCache } from '../../HarmonyCacheProvider'
import { getIndexHtml } from '../getIndexHtml'

const { extractCriticalToChunks, constructStyleTagsFromChunks } =
  createEmotionServer(harmonyCache)

export default function render(
  pageContext: PageContextServer & {
    pageProps: SsrPageProps
    userAgent: string
  }
) {
  const { pageProps, urlPathname } = pageContext
  const { collection } = pageProps

  const isMobile = isMobileUserAgent(pageContext.userAgent)

  const history = createMemoryHistory({
    initialEntries: [urlPathname]
  })

  const {
    title = '',
    description = '',
    canonicalUrl = '',
    structuredData
  } = getCollectionPageSEOFields({
    playlistName: collection.playlist_name,
    userName: collection.user.name,
    userHandle: collection.user.handle,
    permalink: collection.permalink,
    isAlbum: collection.is_album
  })

  const pageHtml = renderToString(
    <ServerWebPlayer
      ssrContextValue={{
        isServerSide: true,
        isSsrEnabled: true,
        pageProps,
        history,
        isMobile
      }}
    >
      <ServerCollectionPage
        collection={collection}
        isMobile={isMobile}
        // @ts-ignore
        title={title}
        description={description}
        canonicalUrl={canonicalUrl}
        structuredData={structuredData}
      />
    </ServerWebPlayer>
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
