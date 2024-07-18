import { useCallback } from 'react'

import { ID } from '@audius/common/models'
import { Avatar, Flex, IconButton, IconSend } from '@audius/harmony'
import { EntityType } from '@audius/sdk/src/sdk/services/EntityManager/types'
import { Form, Formik } from 'formik'

import { TextField } from 'components/form-fields'
import { audiusSdk } from 'services/audius-sdk'

import { useCurrentCommentSection } from './CommentSectionContext'

type CommentFormValues = {
  commentMessage: string
}

const formInitialValues: CommentFormValues = { commentMessage: '' }

type CommentInputFormProps = { parentCommentId?: ID }

export const CommentInputForm = ({
  parentCommentId
}: CommentInputFormProps) => {
  const { userId, entityId } = useCurrentCommentSection()
  const handleSubmit = useCallback(
    async ({ commentMessage }: CommentFormValues) => {
      console.log({ commentMessage })
      if (userId && entityId) {
        try {
          const sdk = await audiusSdk()
          const commentData = {
            body: commentMessage,
            userId,
            entityId,
            entityType: EntityType.TRACK // Comments are only on tracks for now; likely expand to collections in the future
          }
          await sdk.comments.postComment(commentData)
        } catch (e) {
          console.log('COMMENTS DEBUG: Error posting comment', e)
        }
      }
    },
    [entityId, userId]
  )
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
