import { useCallback } from 'react'

import { useTrackByPermalink, useRemixes } from '@audius/common/api'
import { profilePage } from '@audius/common/src/utils/route'
import { remixesPageLineupActions } from '@audius/common/store'
import { useParams } from 'react-router-dom'
import { useNavigate } from 'react-router-dom-v5-compat'

import { TanQueryLineupProps } from 'components/lineup/TanQueryLineup'
import { useIsMobile } from 'hooks/useIsMobile'
import { useMainContentRef } from 'pages/MainContentContext'

import RemixesPageDesktopContent from './components/desktop/RemixesPage'
import RemixesPageMobileContent from './components/mobile/RemixesPage'

type ChildProps = {
  title: string
  count: number | null
  originalTrack: any | null
  user: any | null
  goToTrackPage: () => void
  goToArtistPage: () => void
  getLineupProps: () => TanQueryLineupProps
}

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
  const remixesData = useRemixes({ trackId })

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

  const childProps: ChildProps = {
    title: messages.title,
    count: remixesData.lineup?.entries?.length ?? null,
    originalTrack: originalTrack ?? null,
    user: originalTrack?.user ?? null,
    goToTrackPage,
    goToArtistPage,
    getLineupProps: () => ({
      actions: remixesPageLineupActions,
      scrollParent: ref.current,
      lineupQueryData: remixesData,
      pageSize: remixesData.pageSize
    })
  }

  const isMobile = useIsMobile()

  const Content = isMobile
    ? RemixesPageMobileContent
    : RemixesPageDesktopContent

  return <Content {...childProps} />
}

export default RemixesPage
