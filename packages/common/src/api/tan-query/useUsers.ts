import { useMemo } from 'react'

import { useQueryClient } from '@tanstack/react-query'
import { keyBy, uniq } from 'lodash'
import { useDispatch, useSelector } from 'react-redux'

import { useAudiusQueryContext } from '~/audius-query'
import { ID } from '~/models/Identifiers'
import { UserMetadata } from '~/models/User'
import { CommonState } from '~/store'

import { getUsersBatcher } from './batchers/getUsersBatcher'
import { QUERY_KEYS } from './queryKeys'
import { QueryKey, QueryOptions } from './types'
import { useCurrentUserId } from './useCurrentUserId'
import { getUserQueryKey } from './useUser'
import { combineQueryResults } from './utils/combineQueryResults'
import { useQueries } from './utils/useQueries'

export const getUsersQueryKey = (userIds: ID[] | null | undefined) => {
  return [QUERY_KEYS.users, userIds] as unknown as QueryKey<UserMetadata[]>
}

export const useUsers = (
  userIds: ID[] | null | undefined,
  options?: QueryOptions
) => {
  const { audiusSdk } = useAudiusQueryContext()
  const dispatch = useDispatch()
  const queryClient = useQueryClient()
  const { data: currentUserId } = useCurrentUserId()

  const dedupedUserIds = useMemo(
    () => (userIds ? uniq(userIds) : userIds),
    [userIds]
  )

  const queryResults = useQueries({
    queries: dedupedUserIds?.map((userId) => ({
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
      enabled: options?.enabled !== false && !!userId && userId > 0
    })),
    combine: combineQueryResults<UserMetadata[]>
  })
  const { data: users } = queryResults

  const byId = useMemo(() => keyBy(users, 'user_id'), [users])

  const isSavedToRedux = useSelector((state: CommonState) =>
    dedupedUserIds?.every((userId) => !!state.users.entries[userId])
  )

  return {
    data: isSavedToRedux ? users : undefined,
    byId,
    status: isSavedToRedux ? queryResults.status : 'pending',
    isPending: queryResults.isPending || !isSavedToRedux,
    isLoading: queryResults.isLoading || !isSavedToRedux,
    isFetching: queryResults.isFetching,
    isSuccess: queryResults.isSuccess
  }
}
