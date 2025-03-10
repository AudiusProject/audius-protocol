import { useEffect, useMemo, useState } from 'react'

import { useQueries, useQueryClient } from '@tanstack/react-query'
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
  const [hasInitialized, setHasInitialized] = useState(false)

  useEffect(() => {
    if (userIds?.length) {
      setHasInitialized(true)
    }
  }, [userIds?.length])

  const queryResults = useQueries({
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
  const { data: users } = queryResults

  const byId = useMemo(() => keyBy(users, 'user_id'), [users])

  const isSavedToRedux = useSelector((state: CommonState) =>
    userIds?.every((userId) => !!state.users.entries[userId])
  )

  const isPending = queryResults.isPending || !isSavedToRedux || !hasInitialized
  const isLoading = queryResults.isLoading || !isSavedToRedux || !hasInitialized

  console.log('query loading', queryResults.data?.length, isPending, isLoading)

  const results = {
    ...queryResults,
    data: !isPending ? users : undefined,
    isPending,
    isLoading
  } as typeof queryResults

  return {
    ...results,
    byId
  }
}
