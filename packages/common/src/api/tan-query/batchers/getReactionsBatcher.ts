import { type full, HashId } from '@audius/sdk'
import { create, keyResolver, windowScheduler } from '@yornaath/batshit'
import { memoize } from 'lodash'

import { transformAndCleanList } from '~/adapters'
import { toast } from '~/store/ui/toast/slice'
import { isResponseError } from '~/utils'

import { messages } from '../reactions/messages'
import { Reaction } from '../reactions/types'
import { getReactionsQueryKey } from '../reactions/utils'

import { contextCacheResolver } from './contextCacheResolver'
import { BatchContext } from './types'

export const getReactionsBatcher = memoize(
  (context: BatchContext) =>
    create({
      fetcher: async (entityIds: string[]): Promise<Reaction[]> => {
        const { sdk, queryClient, dispatch } = context
        if (!entityIds.length) return []

        try {
          const { data = [] } = await sdk.full.reactions.bulkGetReactions({
            reactedToIds: entityIds
          })

          // Transform the data
          const reactions = transformAndCleanList(
            data,
            (item: full.Reaction) => ({
              ...item,
              reactionValue: parseInt(item.reactionValue),
              senderUserId: HashId.parse(item.senderUserId)
            })
          )

          // Create a map of all reactions, including empty ones for IDs with no reactions
          const reactionMap = entityIds.reduce<Record<string, Reaction>>(
            (acc: Record<string, Reaction>, id: string) => {
              acc[id] = {
                reactedTo: id,
                reactionValue: null,
                senderUserId: 0
              }
              return acc
            },
            {}
          )

          // Overwrite with actual reactions
          reactions.forEach((reaction) => {
            reactionMap[reaction.reactedTo] = reaction
          })

          // Update the cache for all fetched IDs
          queryClient.setQueryData(getReactionsQueryKey(entityIds), reactionMap)

          // Return array of reactions in same order as input
          return entityIds.map((id) => reactionMap[id])
        } catch (error: unknown) {
          // Handle 404 as a valid case (no reactions)
          if (isResponseError(error) && error.response?.status === 404) {
            // Create empty reactions for all requested IDs
            const emptyReactions = entityIds.reduce<Record<string, Reaction>>(
              (acc: Record<string, Reaction>, id: string) => {
                acc[id] = {
                  reactedTo: id,
                  reactionValue: null,
                  senderUserId: 0
                }
                return acc
              },
              {}
            )

            // Update the cache
            queryClient.setQueryData(
              getReactionsQueryKey(entityIds),
              emptyReactions
            )

            // Return array of empty reactions in same order as input
            return entityIds.map((id) => emptyReactions[id])
          }

          // Report other errors
          dispatch(toast({ content: messages.mutationError('fetching') }))
          throw error
        }
      },
      resolver: keyResolver('reactedTo'),
      scheduler: windowScheduler(2000) // 2s window to collect requests
    }),
  contextCacheResolver()
)
