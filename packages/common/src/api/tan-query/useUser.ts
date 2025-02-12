import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useDispatch, useSelector } from 'react-redux'

import { useAudiusQueryContext } from '~/audius-query'
import { ID } from '~/models/Identifiers'
import { UserMetadata } from '~/models/User'
import { getUserId } from '~/store/account/selectors'

import { getUsersBatcher } from './batchers/getUsersBatcher'
import { QUERY_KEYS } from './queryKeys'
import { QueryOptions } from './types'

export const getUserQueryKey = (userId: ID | null | undefined) => [
  QUERY_KEYS.user,
  userId
]

export const useUser = (
  userId: ID | null | undefined,
  options?: QueryOptions
) => {
  const { audiusSdk } = useAudiusQueryContext()
  const dispatch = useDispatch()
  const queryClient = useQueryClient()
  const currentUserId = useSelector(getUserId)

  return useQuery<UserMetadata | null>({
    queryKey: getUserQueryKey(userId),
    queryFn: async () => {
      const sdk = await audiusSdk()
      const batchGetUsers = getUsersBatcher({
        sdk,
        currentUserId,
        queryClient,
        dispatch
      })
      return await batchGetUsers.fetch({
        id: userId!
      })
    },
    ...options,
    enabled: options?.enabled !== false && !!userId
  })
}
