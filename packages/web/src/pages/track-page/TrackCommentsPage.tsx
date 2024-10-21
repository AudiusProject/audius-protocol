import { useContext, useEffect } from 'react'

import { useGetCurrentUserId, useGetTrackByPermalink } from '@audius/common/api'
import { CommentSectionProvider } from '@audius/common/context'
import { commentsMessages as messages } from '@audius/common/messages'
import { Flex, Text } from '@audius/harmony'
import { useParams } from 'react-router-dom'

import { CommentList } from 'components/comments/CommentList'
import MobilePageContainer from 'components/mobile-page-container/MobilePageContainer'
import NavContext from 'components/nav/mobile/NavContext'

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

  const { track_id, comments_disabled } = track

  return (
    <MobilePageContainer
      title={messages.title}
      css={(theme) => ({
        backgroundColor: theme.color.background.white,
        height: '100%'
      })}
    >
      {comments_disabled ? (
        <Flex p='2xl' justifyContent='center'>
          <Text variant='title'>{messages.commentsDisabled}</Text>
        </Flex>
      ) : (
        <CommentSectionProvider entityId={track_id}>
          <CommentList />
        </CommentSectionProvider>
      )}
    </MobilePageContainer>
  )
}
