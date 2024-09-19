import { useState } from 'react'

import {
  useCurrentCommentSection,
  useEditComment,
  usePostComment
} from '@audius/common/context'
import { commentsMessages as messages } from '@audius/common/messages'
import { SquareSizes } from '@audius/common/models'
import { getTrackId } from '@audius/common/src/store/player/selectors'
import { Avatar, Flex } from '@audius/harmony'
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
}

type CommentFormProps = {
  onSubmit?: ({ commentMessage }: { commentMessage: string }) => void
  initialValue?: string
  hideAvatar?: boolean
  commentId?: string
  parentCommentId?: string
  isEdit?: boolean
}

export const CommentForm = ({
  onSubmit,
  initialValue = '',
  commentId,
  parentCommentId,
  isEdit,
  hideAvatar = false
}: CommentFormProps) => {
  const { currentUserId, entityId, entityType, comments } =
    useCurrentCommentSection()
  const isMobile = useIsMobile()
  const isFirstComment = comments.length === 0
  const [isMobileAppDrawerOpen, toggleIsMobileAppDrawer] = useToggle(false)

  const [editComment] = useEditComment()
  const currentlyPlayingTrackId = useSelector(getTrackId)
  const [postComment] = usePostComment()

  const handlePostComment = (message: string) => {
    const trackPosition = audioPlayer
      ? Math.floor(audioPlayer.getPosition())
      : undefined
    const trackTimestampS =
      currentlyPlayingTrackId === entityId ? trackPosition : undefined

    postComment(message, parentCommentId, trackTimestampS)
  }

  const handleCommentEdit = (commentMessage: string) => {
    if (commentId) {
      editComment(commentId, commentMessage)
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

  const handleSubmit = ({ commentMessage }: CommentFormValues) => {
    if (!commentMessage) return

    if (isEdit) {
      handleCommentEdit(commentMessage)
    } else {
      handlePostComment(commentMessage)
    }

    onSubmit?.({ commentMessage })
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
          placeholder={
            isFirstComment && isMobile
              ? messages.firstComment
              : messages.addComment
          }
          entityId={entityId}
          entityType={entityType}
          presetMessage={initialValue}
          readOnly={isMobile}
          onClick={handleClickInput}
          messageId={0}
          maxLength={400}
          onSubmit={(value: string) => {
            handleSubmit({ commentMessage: value })
          }}
        />
      </Flex>
      <DownloadMobileAppDrawer
        isOpen={isMobileAppDrawerOpen}
        onClose={toggleIsMobileAppDrawer}
      />
    </>
  )
}
