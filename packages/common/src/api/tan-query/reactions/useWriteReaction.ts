import { Id } from '@audius/sdk'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useDispatch } from 'react-redux'

import { useQueryContext } from '~/api/tan-query/utils'
import { Feature } from '~/models'
import { toast } from '~/store/ui/toast/slice'

import { Reaction, WriteReactionArgs, messages } from './types'
import {
  getEntityReactionQueryKey,
  getRawValueFromReaction,
  getReactionsQueryKey
} from './utils'

export const useWriteReaction = () => {
  const { audiusSdk, reportToSentry } = useQueryContext()
  const queryClient = useQueryClient()
  const dispatch = useDispatch()

  return useMutation({
    mutationFn: async ({ entityId, reaction, userId }: WriteReactionArgs) => {
      const sdk = await audiusSdk()
      await sdk.users.sendTipReaction({
        userId: Id.parse(userId),
        metadata: {
          reactedTo: entityId,
          reactionValue: reaction || '😍'
        }
      })
    },
    onMutate: async ({ entityId, reaction, userId }: WriteReactionArgs) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({
        queryKey: getEntityReactionQueryKey(entityId)
      })

      // Snapshot the previous value
      const previousReaction = queryClient.getQueryData<Reaction | null>(
        getEntityReactionQueryKey(entityId)
      )

      // Optimistically update to the new value
      queryClient.setQueryData<Reaction>(getEntityReactionQueryKey(entityId), {
        reactedTo: entityId,
        reactionValue: getRawValueFromReaction(reaction),
        senderUserId: userId
      })

      // Return a context object with the snapshotted value
      return { previousReaction }
    },
    onError: (err, { entityId }, context) => {
      const error = err as Error
      reportToSentry({
        error,
        additionalInfo: { entityId },
        name: 'Reactions',
        feature: Feature.Social
      })
      dispatch(toast({ content: messages.mutationError('writing') }))

      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousReaction) {
        queryClient.setQueryData(
          getEntityReactionQueryKey(entityId),
          context.previousReaction
        )
      }
    },
    onSettled: (_, __, { entityId }) => {
      // Always refetch after error or success to ensure we have the correct data
      queryClient.invalidateQueries({
        queryKey: getEntityReactionQueryKey(entityId)
      })
      queryClient.invalidateQueries({
        queryKey: getReactionsQueryKey([entityId])
      })
    }
  })
}
