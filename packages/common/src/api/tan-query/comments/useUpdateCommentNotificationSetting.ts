import { EntityManagerAction, EntityType } from '@audius/sdk'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useDispatch } from 'react-redux'

import { useAudiusQueryContext } from '~/audius-query'
import { Feature, ID } from '~/models'
import { toast } from '~/store/ui/toast/slice'

import { messages } from './types'
import { getCommentQueryKey } from './utils'

export type UpdateCommentNotificationSettingArgs = {
  userId: ID
  commentId: ID
  action: EntityManagerAction.MUTE | EntityManagerAction.UNMUTE
}

export const useUpdateCommentNotificationSetting = () => {
  const { audiusSdk, reportToSentry } = useAudiusQueryContext()
  const queryClient = useQueryClient()
  const dispatch = useDispatch()
  return useMutation({
    mutationFn: async (args: UpdateCommentNotificationSettingArgs) => {
      const { userId, commentId, action } = args
      const sdk = await audiusSdk()
      await sdk.comments.updateCommentNotificationSetting({
        userId,
        entityId: commentId,
        entityType: EntityType.COMMENT,
        action
      })
    },
    onMutate: ({ commentId, action }) => {
      queryClient.setQueryData(getCommentQueryKey(commentId), (prevData) => {
        if (prevData) {
          return {
            ...prevData,
            isMuted: action === EntityManagerAction.MUTE
          }
        }
        return { isMuted: action === EntityManagerAction.MUTE }
      })
    },
    onError: (error: Error, args) => {
      const { commentId } = args
      reportToSentry({
        error,
        additionalInfo: args,
        name: 'Comments',
        feature: Feature.Comments
      })
      dispatch(
        toast({ content: messages.updateCommentNotificationSettingError })
      )
      queryClient.resetQueries({
        queryKey: getCommentQueryKey(commentId)
      })
    }
  })
}
