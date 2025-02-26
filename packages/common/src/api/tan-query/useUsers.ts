import { useMemo } from 'react'

import { useQueries, useQueryClient } from '@tanstack/react-query'
import { keyBy } from 'lodash'
import { useDispatch } from 'react-redux'

import { useAudiusQueryContext } from '~/audius-query'
import { ID } from '~/models/Identifiers'
import { UserMetadata } from '~/models/User'

import { getUsersBatcher } from './batchers/getUsersBatcher'
import { QUERY_KEYS } from './queryKeys'
import { QueryOptions } from './types'
import { useCurrentUserId } from './useCurrentUserId'
import { getUserQueryKey } from './useUser'
import { combineQueryResults } from './utils/combineQueryResults'

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

  const { data: users, ...queryResults } = useQueries({
    queries: (userIds ?? []).map((userId) => ({
      queryKey: getUserQueryKey(userId),
      queryFn: async () => {
        const sdk = await audiusSdk()
        const batchGetUsers = getUsersBatcher({
          sdk,
          currentUserId,
          queryClient,
          dispatch
        })
        return await batchGetUsers.fetch(userId)
      },
      ...options,
      enabled: options?.enabled !== false && !!userId
    })),
    combine: combineQueryResults<UserMetadata[]>
  })

  const byId = useMemo(() => {
    const byId = keyBy(users, 'user_id')
    return byId
  }, [users])

  return {
    data: users,
    byId,
    ...queryResults
  }
}
