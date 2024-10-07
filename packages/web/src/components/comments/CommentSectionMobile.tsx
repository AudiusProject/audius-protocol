import { useEffect } from 'react'

import { useGetTrackById } from '@audius/common/api'
import { useCurrentCommentSection } from '@audius/common/context'
import { commentsMessages as messages } from '@audius/common/messages'
import {
  Flex,
  IconCaretRight,
  Paper,
  PlainButton,
  Skeleton,
  Text
} from '@audius/harmony'
import { push as pushRoute } from 'connected-react-router'
import { useDispatch } from 'react-redux'
import { Link } from 'react-router-dom'
import { useSearchParams } from 'react-router-dom-v5-compat'

import { useHistoryContext } from 'app/HistoryProvider'

import { CommentBlock } from './CommentBlock'
import { CommentForm } from './CommentForm'

const CommentSectionHeader = () => {
  const {
    entityId,
    commentSectionLoading: isLoading,
    commentIds
  } = useCurrentCommentSection()

  const { data: track } = useGetTrackById({ id: entityId })

  const isShowingComments = !isLoading && commentIds?.length

  return (
    <Flex
      direction='row'
      w='100%'
      justifyContent='space-between'
      alignItems='center'
    >
      <Text variant='title' size='m'>
        Comments
        {isShowingComments ? (
          <Text color='subdued'>&nbsp;({commentIds.length})</Text>
        ) : null}
      </Text>
      {isShowingComments ? (
        <PlainButton iconRight={IconCaretRight} variant='subdued' asChild>
          <Link to={`${track?.permalink}/comments`}>{messages.viewAll}</Link>
        </PlainButton>
      ) : null}
    </Flex>
  )
}

const CommentSectionContent = () => {
  const {
    currentUserId,
    commentSectionLoading: isLoading,
    commentIds
  } = useCurrentCommentSection()

  // Loading state
  if (isLoading) {
    return (
      <Flex direction='row' gap='s' alignItems='center'>
        <Skeleton w={40} h={40} css={{ borderRadius: 100 }} />
        <Flex gap='s'>
          <Skeleton h={20} w={240} />
          <Skeleton h={20} w={160} />
        </Flex>
      </Flex>
    )
  }

  // Empty state
  if (!commentIds || !commentIds.length) {
    return (
      <Flex gap='m' column alignItems='flex-start'>
        <Text variant='body'>{messages.noComments}</Text>
        <CommentForm hideAvatar={!currentUserId} />
      </Flex>
    )
  }

  return <CommentBlock commentId={commentIds[0]} hideActions />
}

export const CommentSectionMobile = () => {
  const dispatch = useDispatch()
  const { track } = useCurrentCommentSection()
  const [searchParams] = useSearchParams()
  const showComments = searchParams.get('showComments')
  const { history } = useHistoryContext()

  // Show the comment screen if the showComments query param is present
  useEffect(() => {
    if (showComments) {
      history.replace({ search: '' })
      dispatch(pushRoute(`${track?.permalink}/comments`))
    }
  }, [showComments, track, dispatch, searchParams, history])

  return (
    <Flex gap='s' direction='column' w='100%' alignItems='flex-start'>
      <CommentSectionHeader />
      <Paper w='100%' direction='column' gap='s' p='l'>
        <CommentSectionContent />
      </Paper>
    </Flex>
  )
}
