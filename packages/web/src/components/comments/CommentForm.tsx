import { Avatar, Flex, IconButton, IconSend } from '@audius/harmony'
import { Form, Formik } from 'formik'

import { TextField } from 'components/form-fields'

type CommentFormValues = {
  commentMessage: string
}

type CommentFormProps = {
  onSubmit: (commentMessage: string) => void
  initialValue?: string
  hideAvatar?: boolean
}

export const CommentForm = ({
  onSubmit,
  initialValue = '',
  hideAvatar = false
}: CommentFormProps) => {
  const handleSubmit = ({ commentMessage }: CommentFormValues) => {
    onSubmit?.(commentMessage)
  }

  const formInitialValues: CommentFormValues = { commentMessage: initialValue }
  return (
    <Formik initialValues={formInitialValues} onSubmit={handleSubmit}>
      <Form style={{ width: '100%' }}>
        <Flex w='100%' gap='m' alignItems='center' justifyContent='center'>
          {!hideAvatar ? (
            <Avatar
              size='auto'
              css={{ width: 40, height: 40, flexShrink: 0 }}
            />
          ) : null}
          <TextField name='commentMessage' label='Add a comment' />
          <IconButton
            aria-label='Post comment'
            icon={IconSend}
            color='accent'
            type='submit'
          />
        </Flex>
      </Form>
    </Formik>
  )
}
