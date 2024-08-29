import { useGetTrackById } from '@audius/common/api'
import {
  useCurrentCommentSection,
  usePostComment
} from '@audius/common/context'
import { Status } from '@audius/common/models'
import {
  Flex,
  IconCaretRight,
  Paper,
  PlainButton,
  Skeleton,
  Text
} from '@audius/harmony'
import { Link } from 'react-router-dom'

import { CommentBlock } from './CommentBlock'
import { CommentForm } from './CommentForm'

const messages = {
  noComments: 'Nothing here yet',
  viewAll: 'View All'
}

const CommentSectionHeader = () => {
  const {
    entityId,
    commentSectionLoading: isLoading,
    comments
  } = useCurrentCommentSection()

  const { data: track } = useGetTrackById({ id: entityId })

  const handleClickViewAll = () => {
    // TODO open the page
    // openDrawer({ userId: currentUserId, entityId, isEntityOwner, artistId })
  }

  const isShowingComments = !isLoading && comments?.length

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
          <Text color='subdued'>&nbsp;({comments.length})</Text>
        ) : null}
      </Text>
      {isShowingComments ? (
        <PlainButton
          onClick={handleClickViewAll}
          iconRight={IconCaretRight}
          variant='subdued'
          asChild
        >
          <Link to={`${track?.permalink}/comments`}>{messages.viewAll}</Link>
        </PlainButton>
      ) : null}
    </Flex>
  )
}

const CommentSectionContent = () => {
  const { commentSectionLoading: isLoading, comments } =
    useCurrentCommentSection()

  const [postComment, { status: postCommentStatus }] = usePostComment()

  const handlePostComment = (message: string) => {
    postComment(message, undefined)
  }

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
  if (!comments || !comments.length) {
    return (
      <Flex gap='m'>
        <Text variant='body'>{messages.noComments}</Text>
        <CommentForm
          onSubmit={handlePostComment}
          isLoading={postCommentStatus === Status.LOADING}
        />
      </Flex>
    )
  }

  return <CommentBlock comment={comments[0]} hideActions />
}

export const CommentSectionMobile = () => {
  return (
    <Flex gap='s' direction='column' w='100%' alignItems='flex-start'>
      <CommentSectionHeader />
      <Paper w='100%' direction='column' gap='s' p='l'>
        <CommentSectionContent />
      </Paper>
    </Flex>
  )
}
