import { useEffect } from 'react'

import {
  useCurrentCommentSection,
  useEditComment,
  usePostComment
} from '@audius/common/context'
import { SquareSizes, Status } from '@audius/common/models'
import { getTrackId } from '@audius/common/src/store/player/selectors'
import {
  Avatar,
  Flex,
  IconButton,
  IconSend,
  LoadingSpinner
} from '@audius/harmony'
import { Form, Formik, useFormikContext } from 'formik'
import { useSelector } from 'react-redux'
import { usePrevious, useToggle } from 'react-use'

import { DownloadMobileAppDrawer } from 'components/download-mobile-app-drawer/DownloadMobileAppDrawer'
import { TextField } from 'components/form-fields'
import { useAuthenticatedCallback } from 'hooks/useAuthenticatedCallback'
import { useIsMobile } from 'hooks/useIsMobile'
import { useProfilePicture } from 'hooks/useUserProfilePicture'
import { audioPlayer } from 'services/audio-player'

const messages = {
  postComment: 'Post Comment',
  addComment: 'Add a comment',
  firstComment: 'Be the first to comment!'
}

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
  const { currentUserId, entityId, comments } = useCurrentCommentSection()
  const isMobile = useIsMobile()
  const isFirstComment = comments.length === 0
  const [isMobileAppDrawerOpen, toggleIsMobileAppDrawer] = useToggle(false)

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
    if (isEdit) {
      handleCommentEdit(commentMessage)
    } else {
      handlePostComment(commentMessage)
    }
    onSubmit?.({ commentMessage })
  }
  const isLoading = postCommentStatus === Status.LOADING

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
          <TextField
            name='commentMessage'
            label={
              isFirstComment && isMobile
                ? messages.firstComment
                : messages.addComment
            }
            readOnly={isMobile}
            onClick={handleClickInput}
            disabled={isLoading}
          />
          {isLoading ? (
            <LoadingSpinner />
          ) : (
            <IconButton
              aria-label={messages.postComment}
              icon={IconSend}
              color='accent'
              type='submit'
            />
          )}
        </Flex>
        <DownloadMobileAppDrawer
          isOpen={isMobileAppDrawerOpen}
          onClose={toggleIsMobileAppDrawer}
        />
      </Form>
    </Formik>
  )
}
