import { useMemo } from 'react'

import { useQueryClient } from '@tanstack/react-query'
import { keyBy } from 'lodash'
import { useDispatch, useSelector } from 'react-redux'

import { useAudiusQueryContext } from '~/audius-query'
import { ID } from '~/models/Identifiers'
import { UserMetadata } from '~/models/User'
import { CommonState } from '~/store'

import { getUsersBatcher } from './batchers/getUsersBatcher'
import { QUERY_KEYS } from './queryKeys'
import { QueryOptions } from './types'
import { useCurrentUserId } from './useCurrentUserId'
import { getUserQueryKey } from './useUser'
import { combineQueryResults } from './utils/combineQueryResults'
import { useQueries } from './utils/useQueries'
export const getUsersQueryKey = (userIds: ID[] | null | undefined) => [
  QUERY_KEYS.users,
  userIds
]

export const useUsers = (
  userIds: ID[] | null | undefined,
  options?: Omit<QueryOptions<UserMetadata[]>, 'select'>
) => {
  const { audiusSdk } = useAudiusQueryContext()
  const dispatch = useDispatch()
  const queryClient = useQueryClient()
  const { data: currentUserId } = useCurrentUserId()

  const queryResults = useQueries({
    queries: userIds?.map((userId) => ({
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
      ...(options as any),
      enabled: options?.enabled !== false && !!userId && userId > 0
    })),
    combine: combineQueryResults<UserMetadata[]>
  })
  const { data: users } = queryResults

  const byId = useMemo(() => keyBy(users, 'user_id'), [users])

  const isSavedToRedux = useSelector((state: CommonState) =>
    userIds?.every((userId) => !!state.users.entries[userId])
  )

  return {
    ...queryResults,
    data: isSavedToRedux ? users : undefined,
    isPending: queryResults.isPending || !isSavedToRedux,
    isLoading: queryResults.isLoading || !isSavedToRedux,
    byId
  }
}
