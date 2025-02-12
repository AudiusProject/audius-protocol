import { Id, OptionalId } from '@audius/sdk'
import { QueryClient, useQueries, useQueryClient } from '@tanstack/react-query'
import { create, keyResolver, windowScheduler } from '@yornaath/batshit'
import { useDispatch } from 'react-redux'
import { Dispatch } from 'redux'

import { userMetadataListFromSDK } from '~/adapters/user'
import { useAudiusQueryContext } from '~/audius-query'
import { ID } from '~/models/Identifiers'
import { UserMetadata } from '~/models/User'
import { removeNullable } from '~/utils/typeUtils'

import { QUERY_KEYS } from './queryKeys'
import { QueryOptions } from './types'
import { useCurrentUserId } from './useCurrentUserId'
import { getUserQueryKey } from './useUser'
import { combineQueryResults } from './utils/combineQueryResults'
import { primeUserData } from './utils/primeUserData'

type BatchContext = {
  sdk: any
  currentUserId: ID | null | undefined
  queryClient: QueryClient
  dispatch: Dispatch
}

type BatchQuery = {
  id: ID
  context: BatchContext
}

const getUsersBatcher = create({
  fetcher: async (queries: BatchQuery[]): Promise<UserMetadata[]> => {
    // Hack because batshit doesn't support context properly
    const { sdk, currentUserId, queryClient, dispatch } = queries[0].context
    if (!queries.length) return []
    const ids = queries.map((q) => q.id)
    const { data } = await sdk.full.users.getBulkUsers({
      id: ids.map((id: ID) => Id.parse(id)).filter(removeNullable),
      userId: OptionalId.parse(currentUserId)
    })

    // prime the users in the cache
    const users = userMetadataListFromSDK(data)
    primeUserData({ users, queryClient, dispatch })

    return users
  },
  resolver: keyResolver('user_id'),
  scheduler: windowScheduler(10)
})

export const getUsersQueryKey = (userIds: ID[] | null | undefined) => [
  QUERY_KEYS.users,
  userIds
]

export const useUsers = (
  userIds: ID[] | null | undefined,
  options?: QueryOptions
) => {
  const { audiusSdk } = useAudiusQueryContext()
  const dispatch = useDispatch()
  const queryClient = useQueryClient()
  const { data: currentUserId } = useCurrentUserId()

  return useQueries({
    queries: (userIds ?? []).map((userId) => ({
      queryKey: getUserQueryKey(userId),
      queryFn: async () => {
        const sdk = await audiusSdk()
        return await getUsersBatcher.fetch({
          id: userId,
          context: { sdk, currentUserId, queryClient, dispatch }
        })
      },
      ...options,
      enabled: options?.enabled !== false && !!userId,
      staleTime: options?.staleTime ?? Infinity,
      gcTime: Infinity
    })),
    combine: combineQueryResults<UserMetadata[]>
  })
}
