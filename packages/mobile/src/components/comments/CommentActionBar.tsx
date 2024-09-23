import { useState } from 'react'

import {
  useCurrentCommentSection,
  useReactToComment
} from '@audius/common/context'
import { commentsMessages as messages } from '@audius/common/messages'
import type { Comment, ReplyComment } from '@audius/sdk'

import { Flex, PlainButton, Text } from '@audius/harmony-native'

import { FavoriteButton } from '../favorite-button'

import { CommentOverflowMenu } from './CommentOverflowMenu'

type CommentActionBarProps = {
  comment: Comment | ReplyComment
  isDisabled?: boolean
  hideReactCount?: boolean
}
export const CommentActionBar = (props: CommentActionBarProps) => {
  const { isDisabled, comment, hideReactCount } = props
  const { isCurrentUserReacted, reactCount, id: commentId } = comment

  const [reactToComment] = useReactToComment()
  const [reactionState, setReactionState] = useState(isCurrentUserReacted) // TODO: need to pull starting value from metadata
  const { setReplyingToComment } = useCurrentCommentSection()

  const handleCommentReact = () => {
    setReactionState(!reactionState)
    reactToComment(commentId, !reactionState)
  }

  return (
    <>
      <Flex direction='row' gap='l' alignItems='center'>
        <Flex direction='row' alignItems='center' gap='xs'>
          <FavoriteButton
            onPress={handleCommentReact}
            isActive={reactionState}
            wrapperStyle={{ height: 20, width: 20 }}
            isDisabled={isDisabled}
          />
          {!hideReactCount ? (
            <Text color='default' size='s'>
              {reactCount}
            </Text>
          ) : null}
        </Flex>
        <PlainButton
          variant='subdued'
          onPress={() => {
            setReplyingToComment?.(comment)
          }}
          disabled={isDisabled}
        >
          {messages.reply}
        </PlainButton>
        <CommentOverflowMenu comment={comment} disabled={isDisabled} />
      </Flex>
    </>
  )
}
