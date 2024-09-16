import { useEffect, useState } from 'react'

import {
  useCurrentCommentSection,
  useEditComment,
  usePostComment
} from '@audius/common/context'
import { commentsMessages as messages } from '@audius/common/messages'
import { SquareSizes, Status } from '@audius/common/models'
import { getTrackId } from '@audius/common/src/store/player/selectors'
import { Avatar, Flex } from '@audius/harmony'
import { Form, Formik, useFormikContext } from 'formik'
import { useSelector } from 'react-redux'
import { usePrevious, useToggle } from 'react-use'

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

// TODO: KJ - There is a bit of hacky-ness here with the input. It does not actually work with the form so the form can probably be taken out

// This is annoying af to have to make a component for; but necessary so that can use the resetForm method from context
const FormResetHandler = ({
  isLoading
}: {
  isLoading: boolean | undefined
}) => {
  const prevIsLoading = usePrevious(isLoading)
  const { resetForm } = useFormikContext()
  useEffect(() => {
    if (!isLoading && prevIsLoading) {
      resetForm()
    }
  }, [prevIsLoading, isLoading, resetForm])
  return null
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
  const [messageId, setMessageId] = useState(0)

  const [editComment] = useEditComment()
  const currentlyPlayingTrackId = useSelector(getTrackId)
  const [postComment, { status: postCommentStatus }] = usePostComment()

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

  const isLoading = postCommentStatus === Status.LOADING
  const prevIsLoading = usePrevious(isLoading)

  useEffect(() => {
    if (!isLoading && prevIsLoading) {
      setMessageId((id) => ++id)
    }
  }, [prevIsLoading, isLoading])

  const formInitialValues: CommentFormValues = { commentMessage: initialValue }
  return (
    <Formik initialValues={formInitialValues} onSubmit={handleSubmit}>
      <Form style={{ width: '100%' }}>
        <FormResetHandler isLoading={isLoading} />
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
            name='commentMessage'
            entityId={entityId}
            entityType={entityType}
            readOnly={isMobile}
            disabled={isLoading}
            onClick={handleClickInput}
            messageId={messageId}
            maxLength={400}
            isLoading={isLoading}
            onSubmit={(value: string) => {
              handleSubmit({ commentMessage: value })
            }}
          />
        </Flex>
        <DownloadMobileAppDrawer
          isOpen={isMobileAppDrawerOpen}
          onClose={toggleIsMobileAppDrawer}
        />
      </Form>
    </Formik>
  )
}
