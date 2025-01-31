import { useCallback } from 'react'

import { useAiTracks, useUserByHandle } from '@audius/common/api'
import { aiPageLineupActions } from '@audius/common/store'
import { route } from '@audius/common/utils'
import { useParams } from 'react-router-dom'
import { useNavigate } from 'react-router-dom-v5-compat'

import { useIsMobile } from 'hooks/useIsMobile'
import { useMainContentRef } from 'pages/MainContentContext'

import AiPageDesktopContent from './components/desktop/AiPage'
import { ShareAiTracksTile } from './components/desktop/ShareAiTracksTile'
import AiPageMobileContent from './components/mobile/AiPage'

const { profilePage } = route

const messages = {
  title: 'AI Generated Tracks'
}

export const AiPage = () => {
  const { handle } = useParams<{ handle: string }>()
  const ref = useMainContentRef()
  const aiTracksData = useAiTracks({ handle })
  const isMobile = useIsMobile()
  const Content = isMobile ? AiPageMobileContent : AiPageDesktopContent
  const { data: user } = useUserByHandle(handle)

  const getLineupProps = () => ({
    actions: aiPageLineupActions,
    scrollParent: ref.current,
    lineupQueryData: aiTracksData,
    pageSize: aiTracksData.pageSize,
    endOfLineup: <ShareAiTracksTile />
  })

  const navigate = useNavigate()

  const goToArtistPage = useCallback(() => {
    if (user) {
      navigate(profilePage(user?.handle))
    }
  }, [navigate, user])

  return (
    <Content
      title={messages.title}
      user={user ?? null}
      getLineupProps={getLineupProps}
      goToArtistPage={goToArtistPage}
    />
  )
}
