import { useCallback, useEffect } from 'react'

import { useGetTrackById } from '@audius/common/api'
import {
  CommentSectionProvider,
  useCurrentCommentSection
} from '@audius/common/context'
import { commentsMessages as messages } from '@audius/common/messages'
import { ID } from '@audius/common/models'
import {
  Flex,
  IconCaretRight,
  IconMessage,
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

const CommentPreviewHeader = () => {
  const {
    entityId,
    commentSectionLoading: isLoading,
    commentIds,
    commentCount
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
      <Flex gap='s'>
        <IconMessage color='default' />
        <Text variant='title' size='l'>
          Comments
          {isShowingComments ? (
            <Text color='subdued'>&nbsp;({commentCount})</Text>
          ) : null}
        </Text>
      </Flex>
      {isShowingComments ? (
        <PlainButton iconRight={IconCaretRight} variant='subdued' asChild>
          <Link to={`${track?.permalink}/comments`}>{messages.viewAll}</Link>
        </PlainButton>
      ) : null}
    </Flex>
  )
}

const CommentPreviewContent = () => {
  const {
    entityId,
    currentUserId,
    commentSectionLoading: isLoading,
    commentIds
  } = useCurrentCommentSection()
  const dispatch = useDispatch()

  const { data: track } = useGetTrackById({ id: entityId })

  const handleClick = useCallback(() => {
    dispatch(pushRoute(`${track?.permalink}/comments`))
  }, [track, dispatch])

  // Loading state
  if (isLoading) {
    return (
      <Paper w='100%' direction='column' gap='s' p='l'>
        <Flex direction='row' gap='s' alignItems='center'>
          <Skeleton w={40} h={40} css={{ borderRadius: 100 }} />
          <Flex gap='s' direction='column'>
            <Skeleton h={20} w={240} />
            <Skeleton h={20} w={160} />
          </Flex>
        </Flex>
      </Paper>
    )
  }

  // Empty state
  if (!commentIds || !commentIds.length) {
    return (
      <Paper w='100%' direction='column' gap='s' p='l'>
        <Flex gap='m' column alignItems='flex-start'>
          <Text variant='body'>{messages.noComments}</Text>
          <CommentForm hideAvatar={!currentUserId} />
        </Flex>
      </Paper>
    )
  }

  return (
    <Paper w='100%' direction='column' gap='s' p='l' onClick={handleClick}>
      <CommentBlock commentId={commentIds[0]} isPreview />
    </Paper>
  )
}

type CommentPreviewProps = {
  entityId: ID
}

export const CommentPreview = (props: CommentPreviewProps) => {
  const { entityId } = props
  const dispatch = useDispatch()
  const { data: track } = useGetTrackById({ id: entityId })
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
    <CommentSectionProvider entityId={entityId}>
      <Flex gap='s' direction='column' w='100%' alignItems='flex-start'>
        <CommentPreviewHeader />
        <CommentPreviewContent />
      </Flex>
    </CommentSectionProvider>
  )
}
