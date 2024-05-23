import type { Track, User } from '@audius/common/models'
import createEmotionServer from '@emotion/server/create-instance'
import { renderToString } from 'react-dom/server'
import { Helmet } from 'react-helmet'
import { escapeInject, dangerouslySkipEscape } from 'vike/server'
import type { PageContextServer } from 'vike/types'

import { ServerWebPlayer } from 'app/web-player/ServerWebPlayer'
import { ServerTrackPage } from 'pages/track-page/ServerTrackPage'
import { isMobileUserAgent } from 'utils/clientUtil'

import { harmonyCache } from '../../HarmonyCacheProvider'
import { getIndexHtml } from '../getIndexHtml'

const { extractCriticalToChunks, constructStyleTagsFromChunks } =
  createEmotionServer(harmonyCache)

type TrackPageContext = PageContextServer & {
  pageProps: {
    track: Track
    user: User
  }
  userAgent: string
}

export default function render(pageContext: TrackPageContext) {
  const { pageProps, userAgent } = pageContext
  const { track, user } = pageProps
  const { track_id } = track
  const { user_id } = user

  const isMobile = isMobileUserAgent(userAgent)

  const pageHtml = renderToString(
    <ServerWebPlayer
      isMobile={isMobile}
      initialState={{
        tracks: { entries: { [track_id]: { metadata: track } } },
        users: { entries: { [user_id]: { metadata: user } } }
      }}
    >
      <ServerTrackPage trackId={track_id} />
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
