import { useMemo } from 'react'

import { useQueryClient } from '@tanstack/react-query'
import { keyBy } from 'lodash'
import { useDispatch, useSelector } from 'react-redux'

import { useQueryContext } from '~/api/tan-query/utils'
import { ID } from '~/models/Identifiers'
import { UserMetadata } from '~/models/User'
import { CommonState } from '~/store'

import { QUERY_KEYS } from '../queryKeys'
import { QueryKey, QueryOptions } from '../types'
import { combineQueryResults } from '../utils/combineQueryResults'
import { useQueries } from '../utils/useQueries'

import { useCurrentUserId } from './account/useCurrentUserId'
import { getUserQueryFn, getUserQueryKey } from './useUser'

export const getUsersQueryKey = (userIds: ID[] | null | undefined) => {
  return [QUERY_KEYS.users, userIds] as unknown as QueryKey<UserMetadata[]>
}

export const useUsers = (
  userIds: ID[] | null | undefined,
  options?: QueryOptions
) => {
  const { audiusSdk } = useQueryContext()
  const dispatch = useDispatch()
  const queryClient = useQueryClient()
  const { data: currentUserId } = useCurrentUserId()

  const queryResults = useQueries({
    queries: userIds?.map((userId) => ({
      queryKey: getUserQueryKey(userId),
      queryFn: async () =>
        getUserQueryFn(
          userId,
          currentUserId,
          queryClient,
          await audiusSdk(),
          dispatch
        ),
      ...options,
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
    data: isSavedToRedux ? users : undefined,
    byId,
    status: isSavedToRedux ? queryResults.status : 'pending',
    isPending: queryResults.isPending || !isSavedToRedux,
    isLoading: queryResults.isLoading || !isSavedToRedux,
    isFetching: queryResults.isFetching,
    isSuccess: queryResults.isSuccess,
    isError: queryResults.isError
  }
}
