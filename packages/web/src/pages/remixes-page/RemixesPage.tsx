import { useCallback } from 'react'

import { useTrackByPermalink, useRemixes } from '@audius/common/api'
import { profilePage } from '@audius/common/src/utils/route'
import { remixesPageLineupActions } from '@audius/common/store'
import { useParams } from 'react-router-dom'
import { useNavigate } from 'react-router-dom-v5-compat'

import { useTanQueryLineupProps } from 'components/lineup/hooks'
import { useIsMobile } from 'hooks/useIsMobile'
import { useMainContentRef } from 'pages/MainContentContext'

import RemixesPageDesktopContent from './components/desktop/RemixesPage'
import RemixesPageMobileContent from './components/mobile/RemixesPage'

const messages = {
  title: 'Remixes',
  description: 'Remixes'
}

const RemixesPage = () => {
  const { handle, slug } = useParams<{ handle: string; slug: string }>()
  const ref = useMainContentRef()
  const navigate = useNavigate()

  const { data: originalTrack } = useTrackByPermalink(
    handle && slug ? `/${handle}/${slug}` : null
  )
  const trackId = originalTrack?.track_id
  const { lineup, loadNextPage, play, pause, isPlaying, pageSize } = useRemixes(
    { trackId }
  )

  const lineupProps = useTanQueryLineupProps()

  const goToTrackPage = useCallback(() => {
    if (originalTrack) {
      navigate(originalTrack.permalink)
    }
  }, [navigate, originalTrack])

  const goToArtistPage = useCallback(() => {
    if (originalTrack?.user) {
      navigate(profilePage(originalTrack.user.handle))
    }
  }, [navigate, originalTrack])

  const childProps = {
    title: messages.title,
    count: lineup?.entries?.length ?? null,
    originalTrack: originalTrack ?? null,
    user: originalTrack?.user ?? null,
    goToTrackPage,
    goToArtistPage
  }

  const getLineupProps = () => ({
    scrollParent: ref.current,
    lineup,
    loadMore: loadNextPage,
    playing: isPlaying,
    playTrack: play,
    pauseTrack: pause,
    actions: remixesPageLineupActions,
    pageSize,
    ...lineupProps
  })

  const isMobile = useIsMobile()

  const Content = isMobile
    ? RemixesPageMobileContent
    : RemixesPageDesktopContent

  return <Content getLineupProps={getLineupProps} {...childProps} />
}

export default RemixesPage
