import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useDispatch } from 'react-redux'

import { userMetadataListFromSDK } from '~/adapters/user'
import { useAudiusQueryContext } from '~/audius-query'
import { Id, ID } from '~/models/Identifiers'
import { Kind } from '~/models/Kind'
import { User } from '~/models/User'
import { addEntries } from '~/store/cache/actions'
import { EntriesByKind } from '~/store/cache/types'
import { removeNullable } from '~/utils/typeUtils'

import { QUERY_KEYS } from './queryKeys'
import { Config } from './types'
import { primeUserData } from './utils/primeUserData'

export const useUsers = (userIds: ID[], config?: Config) => {
  const { audiusSdk } = useAudiusQueryContext()
  const dispatch = useDispatch()
  const queryClient = useQueryClient()
  const encodedIds = userIds.map((id) => Id.parse(id)).filter(removeNullable)

  return useQuery({
    queryKey: [QUERY_KEYS.users, userIds],
    queryFn: async () => {
      const sdk = await audiusSdk()
      const { data } = await sdk.full.users.getBulkUsers({
        id: encodedIds
      })

      const users = userMetadataListFromSDK(data)

      // Sync users data to Redux and prime userByHandle cache
      if (users.length) {
        primeUserData({ users, queryClient, dispatch })
        const entries: EntriesByKind = {
          [Kind.USERS]: users.reduce(
            (acc, user) => {
              acc[user.user_id] = user
              // Prime userByHandle cache for each user
              queryClient.setQueryData(
                [QUERY_KEYS.userByHandle, user.handle],
                user
              )
              return acc
            },
            {} as Record<ID, User>
          )
        }

        dispatch(addEntries(entries, undefined, undefined, 'react-query'))
      }

      return users
    },
    staleTime: config?.staleTime,
    enabled: config?.enabled !== false && encodedIds.length > 0
  })
}
