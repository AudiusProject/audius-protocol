import { SsrPageProps } from '@audius/common/models'
import createEmotionServer from '@emotion/server/create-instance'
import { createMemoryHistory } from 'history'
import { renderToString } from 'react-dom/server'
import { Helmet } from 'react-helmet'
import { escapeInject, dangerouslySkipEscape } from 'vike/server'
import type { PageContextServer } from 'vike/types'

import { ServerWebPlayer } from 'app/web-player/ServerWebPlayer'
import { ServerTrackPage } from 'pages/server-track-page/ServerTrackPage'
import { isMobileUserAgent } from 'utils/clientUtil'
import { getTrackPageSEOFields } from 'utils/seo'

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
  const { track } = pageProps

  const isMobile = isMobileUserAgent(pageContext.userAgent)

  const history = createMemoryHistory({
    initialEntries: [urlPathname]
  })

  const {
    title = '',
    description = '',
    canonicalUrl = '',
    structuredData
  } = getTrackPageSEOFields({
    title: track.title,
    userName: track.user.name,
    permalink: track.permalink,
    releaseDate: track.release_date ?? track.created_at ?? ''
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
      <ServerTrackPage
        isMobile={isMobile}
        // @ts-ignore
        title={title}
        description={description}
        canonicalUrl={canonicalUrl}
        structuredData={structuredData}
        heroTrack={track}
        user={track.user}
        userId={track.user.id}
        hasValidRemixParent={false}
        heroPlaying={false}
        previewing={false}
        badge={null}
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
