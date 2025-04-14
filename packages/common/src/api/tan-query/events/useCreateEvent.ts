import { EventEventTypeEnum, EventEntityTypeEnum } from '@audius/sdk'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { cloneDeep } from 'lodash'

import { useAudiusQueryContext } from '~/audius-query'
import { Event, Feature, ID } from '~/models'
import { toast } from '~/store/ui/toast/slice'

import { getEventQueryKey, getEventsByEntityIdQueryKey } from './utils'

export type CreateEventArgs = {
  eventId?: ID
  eventType: EventEventTypeEnum
  userId: ID
  entityType?: EventEntityTypeEnum
  entityId?: ID
  endDate?: string
  eventData?: Record<string, any>
}

export const useCreateEvent = () => {
  const { audiusSdk, reportToSentry } = useAudiusQueryContext()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (args: CreateEventArgs) => {
      const sdk = await audiusSdk()
      return await sdk.events.createEvent(args)
    },
    onMutate: async (args: CreateEventArgs) => {
      const { userId, eventType, entityType, entityId, endDate, eventData } =
        args
      // This executes before the mutationFn is called, and the reference to comment is the same in both
      // therefore, this sets the id that will be posted to the server
      const sdk = await audiusSdk()
      const newId = await sdk.events.generateEventId()
      // hack alert: there is no way to send context from onMutate to mutationFn so we hack it into the args
      args.eventId = newId

      const newEvent: Event = {
        eventId: newId,
        entityId: entityId ?? null,
        entityType,
        userId,
        eventType,
        isDeleted: false,
        endDate,
        eventData: eventData ?? {},
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      // Update the individual event cache
      queryClient.setQueryData(getEventQueryKey(newId), newEvent)

      let prevState: Event[] = []
      // Add event to the list of events for the entity
      queryClient.setQueryData(
        getEventsByEntityIdQueryKey({ entityId, entityType }),
        (prevData) => {
          const newState = cloneDeep(prevData) ?? []
          prevState = newState
          newState.unshift(newEvent)
          return newState
        }
      )

      return { prevState }
    },
    onError: (error: Error, args, context) => {
      reportToSentry({
        error,
        additionalInfo: args,
        name: 'Events',
        feature: Feature.Events
      })

      // Revert the optimistic updates
      queryClient.resetQueries({
        queryKey: getEventQueryKey(args.eventId)
      })

      const prevState = context?.prevState
      if (prevState) {
        queryClient.setQueryData(
          getEventsByEntityIdQueryKey({
            entityId: args.entityId,
            entityType: args.entityType
          }),
          prevState
        )
      }

      // Toast generic error message
      toast({
        content: 'There was an error creating the event. Please try again'
      })
    }
  })
}
