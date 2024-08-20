import { useCurrentCommentSection } from '@audius/common/context'
import type { FormikHelpers } from 'formik'
import { Formik, useFormikContext } from 'formik'
import type { TextInput as RNTextInput } from 'react-native'

import { Box, Flex, IconButton, IconSend } from '@audius/harmony-native'

import { ProfilePicture } from '../core'
import { HarmonyTextField } from '../fields'
import LoadingSpinner from '../loading-spinner'

type CommentFormValues = {
  commentMessage: string
}

type CommentFormProps = {
  onSubmit: (commentMessage: string) => void
  initialValue?: string
  isLoading?: boolean
  TextInputComponent?: typeof RNTextInput
}

const messages = {
  beFirstComment: 'Be the first to comment',
  addComment: 'Add a comment'
}

type CommentFormContentProps = Omit<
  CommentFormProps,
  'onSubmit' | 'initialValue'
>

const CommentFormContent = (props: CommentFormContentProps) => {
  const { isLoading, TextInputComponent } = props
  const { currentUserId, comments } = useCurrentCommentSection()
  const { submitForm } = useFormikContext()

  const message = comments?.length
    ? messages.addComment
    : messages.beFirstComment

  return (
    <Flex direction='row' gap='m' alignItems='center'>
      {currentUserId ? (
        <ProfilePicture
          userId={currentUserId}
          style={{ width: 40, height: 40, flexShrink: 0 }}
        />
      ) : null}
      <Box flex={1}>
        <HarmonyTextField
          name='commentMessage'
          label='Add a comment'
          hideLabel
          placeholder={message}
          endAdornment={
            isLoading ? (
              <LoadingSpinner />
            ) : (
              <IconButton
                aria-label='Post comment'
                icon={IconSend}
                color='accent'
                onPress={submitForm}
              />
            )
          }
          TextInputComponent={TextInputComponent}
        />
      </Box>
    </Flex>
  )
}

export const CommentForm = ({
  onSubmit,
  initialValue = '',
  ...rest
}: CommentFormProps) => {
  const handleSubmit = (
    { commentMessage }: CommentFormValues,
    { resetForm }: FormikHelpers<CommentFormValues>
  ) => {
    onSubmit(commentMessage)
    resetForm()
  }

  const formInitialValues: CommentFormValues = { commentMessage: initialValue }

  return (
    <Formik initialValues={formInitialValues} onSubmit={handleSubmit}>
      <CommentFormContent {...rest} />
    </Formik>
  )
}
