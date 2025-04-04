import { useMutation, useQueryClient } from '@tanstack/react-query'

import { useAudiusQueryContext } from '~/audius-query'
import { Event, Feature, ID } from '~/models'
import { toast } from '~/store/ui/toast/slice'

import { getEventQueryKey } from './utils'

export type DeleteEventArgs = {
  eventId: ID
  userId: ID
}

export const useDeleteEvent = () => {
  const { audiusSdk, reportToSentry } = useAudiusQueryContext()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (args: DeleteEventArgs) => {
      const sdk = await audiusSdk()
      return await sdk.events.deleteEvent({ ...args })
    },
    onMutate: async (args: DeleteEventArgs) => {
      const { eventId } = args

      // Get the current event from cache
      const currentEvent = queryClient.getQueryData(getEventQueryKey(eventId))
      if (!currentEvent) return

      const deletedEvent: Event = {
        ...currentEvent,
        isDeleted: true,
        updatedAt: new Date().toISOString()
      }

      // Update the event cache
      queryClient.setQueryData(getEventQueryKey(eventId), deletedEvent)

      // Return context for rollback
      return { previousEvent: currentEvent }
    },
    onError: (error: Error, args, context) => {
      // Revert the optimistic update
      if (context?.previousEvent) {
        queryClient.setQueryData(
          getEventQueryKey(args.eventId),
          context.previousEvent
        )
      }

      reportToSentry({
        error,
        additionalInfo: args,
        name: 'Events',
        feature: Feature.Events
      })

      toast({
        content: 'There was an error deleting the event. Please try again'
      })
    }
  })
}
