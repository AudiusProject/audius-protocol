import { EntityType, CommentMention } from '@audius/sdk'
import { useMutation } from '@tanstack/react-query'
import { useDispatch } from 'react-redux'

import { useAudiusQueryContext } from '~/audius-query'
import { Feature, ID } from '~/models'
import { toast } from '~/store/ui/toast/slice'

import { useTypedQueryClient } from '../typed-query-client'

import { CommentOrReply, messages } from './types'
import { getCommentQueryKey } from './utils'

export type EditCommentArgs = {
  commentId: ID
  userId: ID
  newMessage: string
  mentions?: CommentMention[]
  trackId: ID
  currentSort: any
  entityType?: EntityType
}

export const useEditComment = () => {
  const { audiusSdk, reportToSentry } = useAudiusQueryContext()
  const queryClient = useTypedQueryClient()
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
      const prevComment = queryClient.getQueryData<CommentOrReply>(
        getCommentQueryKey(commentId)
      )
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
