import { EntityType } from '@audius/sdk'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useDispatch } from 'react-redux'

import { useAudiusQueryContext } from '~/audius-query'
import { Feature } from '~/models'
import { toast } from '~/store/ui/toast/slice'

import { CommentOrReply, EditCommentArgs, messages } from './types'
import { getCommentQueryKey } from './utils'

export const useEditComment = () => {
  const { audiusSdk, reportToSentry } = useAudiusQueryContext()
  const queryClient = useQueryClient()
  const dispatch = useDispatch()
  return useMutation({
    mutationFn: async ({
      commentId,
      userId,
      newMessage,
      trackId,
      mentions,
      entityType = EntityType.TRACK
    }: EditCommentArgs) => {
      const commentData = {
        body: newMessage,
        userId,
        entityId: commentId,
        trackId,
        entityType,
        mentions: mentions?.map((mention) => mention.userId) ?? []
      }
      const sdk = await audiusSdk()
      await sdk.comments.editComment(commentData)
    },
    onMutate: ({ commentId, newMessage, mentions }) => {
      const prevComment = queryClient.getQueryData<CommentOrReply | undefined>([
        'comment',
        commentId
      ])
      queryClient.setQueryData(
        getCommentQueryKey(commentId),
        (prevData: CommentOrReply | undefined) =>
          ({
            ...prevData,
            isEdited: true,
            message: newMessage,
            mentions
          }) as CommentOrReply
      )
      return { prevComment }
    },
    onError: (error: Error, args, context) => {
      const { commentId } = args
      reportToSentry({
        error,
        additionalInfo: args,
        name: 'Comments',
        feature: Feature.Comments
      })
      // Toast standard error message
      dispatch(toast({ content: messages.mutationError('editing') }))

      // Note: context could be undefined if the onMutate threw before returning
      if (context) {
        const { prevComment } = context
        // Revert our optimistic cache change
        queryClient.setQueryData(
          getCommentQueryKey(commentId),
          (prevData: CommentOrReply | undefined) =>
            ({
              ...prevData,
              // NOTE: intentionally only reverting the pieces we changed in case another mutation happened in between this mutation start->error
              isEdited: prevComment?.isEdited,
              message: prevComment?.message,
              mentions: prevComment?.mentions
            }) as CommentOrReply
        )
      }
    }
  })
}
