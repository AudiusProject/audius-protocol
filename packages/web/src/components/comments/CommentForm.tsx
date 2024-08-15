import { useEffect } from 'react'

import { useCurrentCommentSection } from '@audius/common/context'
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
import { usePrevious } from 'react-use'

import { TextField } from 'components/form-fields'
import { useProfilePicture } from 'hooks/useUserProfilePicture'
import { audioPlayer } from 'services/audio-player'

type CommentFormValues = {
  commentMessage: string
}

type CommentFormProps = {
  handleSubmit?: ({ commentMessage }: { commentMessage: string }) => void
  initialValue?: string
  hideAvatar?: boolean
  parentCommentId?: string
  isLoading?: boolean
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
  handleSubmit: handleSubmitProps,
  initialValue = '',
  parentCommentId,
  hideAvatar = false
}: CommentFormProps) => {
  const { userId, entityId, usePostComment } = useCurrentCommentSection()
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
  const profileImage = useProfilePicture(
    userId ?? null,
    SquareSizes.SIZE_150_BY_150
  )

  const handleSubmit = ({ commentMessage }: CommentFormValues) => {
    handlePostComment(commentMessage)
  }
  const isLoading = postCommentStatus === Status.LOADING

  const formInitialValues: CommentFormValues = { commentMessage: initialValue }
  return (
    <Formik
      initialValues={formInitialValues}
      onSubmit={handleSubmitProps ?? handleSubmit}
    >
      <Form style={{ width: '100%' }}>
        <FormResetHandler isLoading={isLoading} />
        <Flex w='100%' gap='m' alignItems='center' justifyContent='center'>
          {!hideAvatar ? (
            <Avatar
              size='auto'
              isLoading={false} // loading is not working correctly?
              src={profileImage}
              css={{ width: 40, height: 40, flexShrink: 0 }}
            />
          ) : null}
          <TextField
            name='commentMessage'
            label='Add a comment'
            disabled={isLoading}
          />
          {isLoading ? (
            <LoadingSpinner />
          ) : (
            <IconButton
              aria-label='Post comment'
              icon={IconSend}
              color='accent'
              type='submit'
            />
          )}
        </Flex>
      </Form>
    </Formik>
  )
}
