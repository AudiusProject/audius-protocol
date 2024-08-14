import { useCurrentCommentSection } from '@audius/common/context'
import { Status } from '@audius/common/models'
import { TouchableOpacity } from 'react-native'

import { Flex, IconCaretRight, Paper, Text } from '@audius/harmony-native'

import Skeleton from '../skeleton'

import { CommentBlock } from './CommentBlock'
import { CommentForm } from './CommentForm'

const messages = {
  noComments: 'Nothing here yet'
}

const CommentSectionHeader = () => {
  const { commentSectionLoading: isLoading, comments } =
    useCurrentCommentSection()
  return (
    <Flex direction='row' w='100%' justifyContent='space-between'>
      <Text variant='title' size='l'>
        Comments
        {!isLoading && comments?.length ? (
          <Text color='subdued'>&nbsp;{comments.length}</Text>
        ) : null}
      </Text>
      <TouchableOpacity onPress={() => console.log('pressed')}>
        <Flex direction='row' alignItems='center' gap='xs'>
          <Text variant='title' color='subdued'>
            View All
          </Text>
          <IconCaretRight color='subdued' height={16} width={16} />
        </Flex>
      </TouchableOpacity>
    </Flex>
  )
}

const CommentSectionContent = () => {
  const {
    commentSectionLoading: isLoading,
    comments,
    usePostComment
  } = useCurrentCommentSection()

  const [postComment, { status: postCommentStatus }] = usePostComment()

  const handlePostComment = (message: string) => {
    postComment(message, undefined)
  }

  // Loading state
  if (isLoading) {
    return (
      <Flex direction='row' gap='s' alignItems='center'>
        <Skeleton width={40} height={40} style={{ borderRadius: 100 }} />
        <Flex gap='s'>
          <Skeleton height={20} width={240} />
          <Skeleton height={20} width={160} />
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

export const CommentSection = () => {
  return (
    <Flex gap='l' direction='column' w='100%' alignItems='flex-start'>
      <CommentSectionHeader />
      <Paper w='100%' direction='column' gap='s' p='l'>
        <CommentSectionContent />
      </Paper>
    </Flex>
  )
}
