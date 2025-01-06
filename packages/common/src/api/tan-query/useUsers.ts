import { useQuery } from '@tanstack/react-query'
import { useDispatch } from 'react-redux'

import { userMetadataListFromSDK } from '~/adapters/user'
import { useAppContext } from '~/context/appContext'
import { ID } from '~/models/Identifiers'
import { Kind } from '~/models/Kind'
import { User } from '~/models/User'
import { addEntries } from '~/store/cache/actions'
import { EntriesByKind } from '~/store/cache/types'
import { encodeHashId } from '~/utils/hashIds'
import { removeNullable } from '~/utils/typeUtils'

import { QUERY_KEYS } from './queryKeys'
import { QueryOptions } from './types'

export const useUsers = (userIds: ID[], options?: QueryOptions) => {
  const { audiusSdk } = useAppContext()
  const dispatch = useDispatch()

  return useQuery({
    queryKey: [QUERY_KEYS.users, userIds],
    queryFn: async () => {
      const encodedIds = userIds.map(encodeHashId).filter(removeNullable)
      if (!encodedIds.length) return []
      const { data } = await audiusSdk!.full.users.getBulkUsers({
        id: encodedIds
      })
      const users = userMetadataListFromSDK(data)

      // Sync users data to Redux
      if (users.length) {
        const entries: EntriesByKind = {
          [Kind.USERS]: users.reduce(
            (acc, user) => {
              acc[user.user_id] = user
              return acc
            },
            {} as Record<ID, User>
          )
        }

        dispatch(addEntries(entries, undefined, undefined, 'react-query'))
      }

      return users
    },
    staleTime: options?.staleTime,
    enabled: options?.enabled !== false && !!audiusSdk && userIds.length > 0
  })
}
