import { useState } from 'react'

import {
  useCurrentCommentSection,
  useEditComment,
  usePostComment
} from '@audius/common/context'
import { commentsMessages as messages } from '@audius/common/messages'
import { ID, SquareSizes } from '@audius/common/models'
import { getTrackId } from '@audius/common/src/store/player/selectors'
import { Avatar, Flex } from '@audius/harmony'
import { CommentMention } from '@audius/sdk'
import { useSelector } from 'react-redux'
import { useToggle } from 'react-use'

import { ComposerInput } from 'components/composer-input/ComposerInput'
import { DownloadMobileAppDrawer } from 'components/download-mobile-app-drawer/DownloadMobileAppDrawer'
import { useAuthenticatedCallback } from 'hooks/useAuthenticatedCallback'
import { useIsMobile } from 'hooks/useIsMobile'
import { useProfilePicture } from 'hooks/useUserProfilePicture'
import { audioPlayer } from 'services/audio-player'

type CommentFormValues = {
  commentMessage: string
  mentions?: CommentMention[]
}

type CommentFormProps = {
  onSubmit?: ({ commentMessage }: { commentMessage: string }) => void
  initialValue?: string
  initialUserMentionIds?: ID[]
  hideAvatar?: boolean
  commentId?: ID
  parentCommentId?: ID
  isEdit?: boolean
  autoFocus?: boolean
  disabled?: boolean
}

export const CommentForm = ({
  onSubmit,
  initialValue = '',
  initialUserMentionIds = [],
  commentId,
  parentCommentId,
  isEdit,
  hideAvatar = false,
  autoFocus,
  disabled = false
}: CommentFormProps) => {
  const { currentUserId, entityId, entityType } = useCurrentCommentSection()
  const isMobile = useIsMobile()
  const [isMobileAppDrawerOpen, toggleIsMobileAppDrawer] = useToggle(false)

  const [messageId, setMessageId] = useState(0) // Message id is used to reset the composer input
  const currentlyPlayingTrackId = useSelector(getTrackId)
  const [postComment] = usePostComment()
  const [editComment] = useEditComment()

  const handlePostComment = (message: string, mentions?: CommentMention[]) => {
    const trackPosition = audioPlayer
      ? Math.floor(audioPlayer.getPosition())
      : undefined
    const trackTimestampS =
      currentlyPlayingTrackId === entityId ? trackPosition : undefined

    postComment(message, parentCommentId, trackTimestampS, mentions)
  }

  const handleCommentEdit = (
    commentMessage: string,
    mentions?: CommentMention[]
  ) => {
    if (commentId) {
      editComment(commentId, commentMessage, mentions)
    }
  }

  const handleClickInput = useAuthenticatedCallback(() => {
    if (isMobile) {
      toggleIsMobileAppDrawer()
    }
  }, [isMobile, toggleIsMobileAppDrawer])

  const profileImage = useProfilePicture(
    currentUserId ?? null,
    SquareSizes.SIZE_150_BY_150
  )

  const handleSubmit = ({ commentMessage, mentions }: CommentFormValues) => {
    if (!commentMessage) return

    if (isEdit) {
      handleCommentEdit(commentMessage, mentions)
    } else {
      handlePostComment(commentMessage, mentions)
    }

    onSubmit?.({ commentMessage })
    // Each instance of form state is tracked with a message id
    // Incrementing the message id "clears" the input value
    setMessageId((prev) => prev + 1)
  }

  return (
    <>
      <Flex w='100%' gap='m' alignItems='center' justifyContent='center'>
        {!hideAvatar ? (
          <Avatar
            size='auto'
            isLoading={false} // loading is not working correctly?
            src={profileImage}
            css={{ width: 44, height: 44, flexShrink: 0 }}
          />
        ) : null}
        <ComposerInput
          autoFocus={autoFocus}
          placeholder={messages.addComment}
          entityId={entityId}
          entityType={entityType}
          presetMessage={initialValue}
          presetUserMentionIds={initialUserMentionIds}
          readOnly={isMobile}
          onClick={handleClickInput}
          messageId={messageId}
          maxLength={400}
          maxMentions={10}
          onSubmit={(value: string, _, mentions) => {
            handleSubmit({ commentMessage: value, mentions })
          }}
          disabled={disabled}
        />
      </Flex>
      <DownloadMobileAppDrawer
        isOpen={isMobileAppDrawerOpen}
        onClose={toggleIsMobileAppDrawer}
      />
    </>
  )
}
