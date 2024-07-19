import { ID } from '@audius/common/models'
import { Avatar, Flex, IconButton, IconSend } from '@audius/harmony'
import { Form, Formik } from 'formik'

import { TextField } from 'components/form-fields'

import { useCurrentCommentSection } from './CommentSectionContext'

type CommentFormValues = {
  commentMessage: string
}

const formInitialValues: CommentFormValues = { commentMessage: '' }

type CommentInputFormProps = { parentCommentId?: ID }

export const CommentInputForm = ({
  parentCommentId
}: CommentInputFormProps) => {
  const { handlePostComment } = useCurrentCommentSection()
  console.log({ parentCommentId })
  const handleSubmit = ({ commentMessage }: CommentFormValues) => {
    handlePostComment(commentMessage, parentCommentId)
  }
  return (
    <Formik initialValues={formInitialValues} onSubmit={handleSubmit}>
      <Form style={{ width: '100%' }}>
        <Flex w='100%' gap='m' alignItems='center' justifyContent='center'>
          <Avatar size='auto' css={{ width: 40, height: 40, flexShrink: 0 }} />
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
