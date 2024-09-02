import { useContext, useEffect } from 'react'

import { useGetCurrentUserId, useGetTrackByPermalink } from '@audius/common/api'
import { CommentSectionProvider } from '@audius/common/context'
import { useParams } from 'react-router-dom'

import { CommentList } from 'components/comments/CommentList'
import MobilePageContainer from 'components/mobile-page-container/MobilePageContainer'
import NavContext from 'components/nav/mobile/NavContext'

const messages = {
  title: 'Comments'
}

type TrackCommentsParams = {
  slug: string
  handle: string
}

export const TrackCommentsPage = () => {
  const { slug, handle } = useParams<TrackCommentsParams>()
  const { data: currentUserId } = useGetCurrentUserId({})
  const { data: track } = useGetTrackByPermalink({
    permalink: `/${handle}/${slug}`,
    currentUserId
  })

  const { setLeft, setCenter, setRight } = useContext(NavContext)

  useEffect(() => {
    setCenter(messages.title)
    setRight(null)
  }, [setCenter, setLeft, setRight])

  if (!track) return null

  return (
    <MobilePageContainer
      title={messages.title}
      css={(theme) => ({ backgroundColor: theme.color.background.white })}
    >
      <CommentSectionProvider entityId={track?.track_id}>
        <CommentList />
      </CommentSectionProvider>
    </MobilePageContainer>
  )
}
