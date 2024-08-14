import { useCurrentCommentSection } from '@audius/common/context'
import type { FormikHelpers } from 'formik'
import { Formik } from 'formik'

import {
  Box,
  Flex,
  IconButton,
  IconPaperAirplane
} from '@audius/harmony-native'

import { ProfilePicture } from '../core'
import { HarmonyTextField } from '../fields'
import LoadingSpinner from '../loading-spinner'

type CommentFormValues = {
  commentMessage: string
}

type CommentFormProps = {
  onSubmit: (commentMessage: string) => void
  initialValue?: string
  hideAvatar?: boolean
  isLoading?: boolean
}

const messages = {
  beFirstComment: 'Be the first to comment'
}

export const CommentForm = ({
  onSubmit,
  initialValue = '',
  hideAvatar = false,
  isLoading
}: CommentFormProps) => {
  const { userId } = useCurrentCommentSection()

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
      <Flex direction='row' gap='m' alignItems='center'>
        {!hideAvatar && userId ? (
          <ProfilePicture
            userId={userId}
            style={{ width: 40, height: 40, flexShrink: 0 }}
          />
        ) : null}
        <Box flex={1}>
          <HarmonyTextField
            name='commentMessage'
            label='Add a comment'
            hideLabel
            placeholder={messages.beFirstComment}
            endAdornment={
              isLoading ? (
                <LoadingSpinner />
              ) : (
                <IconButton
                  aria-label='Post comment'
                  icon={IconPaperAirplane}
                  color='accent'
                />
              )
            }
          />
        </Box>
      </Flex>
    </Formik>
  )
}
