import { SquareSizes } from '@audius/common/models'
import {
  Avatar,
  Flex,
  IconButton,
  IconSend,
  LoadingSpinner
} from '@audius/harmony'
import { Form, Formik, FormikHelpers } from 'formik'

import { TextField } from 'components/form-fields'
import { useProfilePicture } from 'hooks/useUserProfilePicture'

import { useCurrentCommentSection } from './CommentSectionContext'

type CommentFormValues = {
  commentMessage: string
}

type CommentFormProps = {
  onSubmit: (commentMessage: string) => void
  initialValue?: string
  hideAvatar?: boolean
  isLoading?: boolean
}

export const CommentForm = ({
  onSubmit,
  initialValue = '',
  hideAvatar = false,
  isLoading
}: CommentFormProps) => {
  const { userId } = useCurrentCommentSection()
  const profileImage = useProfilePicture(
    userId ?? null,
    SquareSizes.SIZE_150_BY_150
  )

  const handleSubmit = (
    { commentMessage }: CommentFormValues,
    { resetForm }: FormikHelpers<CommentFormValues>
  ) => {
    onSubmit?.(commentMessage)
    resetForm()
  }

  const formInitialValues: CommentFormValues = { commentMessage: initialValue }
  return (
    <Formik initialValues={formInitialValues} onSubmit={handleSubmit}>
      <Form style={{ width: '100%' }}>
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
