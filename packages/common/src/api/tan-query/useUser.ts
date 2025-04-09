import { useMemo } from 'react'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useDispatch, useSelector } from 'react-redux'

import { useAudiusQueryContext } from '~/audius-query'
import { ID } from '~/models/Identifiers'
import { User } from '~/models/User'
import { getUserId } from '~/store/account/selectors'

import { getUsersBatcher } from './batchers/getUsersBatcher'
import { getUserQueryKey } from './queryKeys'
import { SelectableQueryOptions } from './types'

export const useUser = <TResult = User>(
  userId: ID | null | undefined,
  options?: SelectableQueryOptions<User, TResult>
) => {
  const { audiusSdk } = useAudiusQueryContext()
  const dispatch = useDispatch()
  const queryClient = useQueryClient()
  const currentUserId = useSelector(getUserId)
  const validUserId = !!userId && userId > 0

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const select = useMemo(() => options?.select, [])

  return useQuery({
    queryKey: getUserQueryKey(userId),
    queryFn: async () => {
      const sdk = await audiusSdk()
      const batchGetUsers = getUsersBatcher({
        sdk,
        currentUserId,
        queryClient,
        dispatch
      })
      return await batchGetUsers.fetch(userId!)
    },
    ...options,
    select,
    enabled: options?.enabled !== false && validUserId
  })
}
