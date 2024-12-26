import { useQuery } from '@tanstack/react-query'
import { useDispatch } from 'react-redux'

import { userMetadataListFromSDK } from '~/adapters/user'
import { useAppContext } from '~/context/appContext'
import { ID } from '~/models/Identifiers'
import { Kind } from '~/models/Kind'
import { addEntries } from '~/store/cache/actions'
import { EntryMap } from '~/store/cache/types'
import { encodeHashId } from '~/utils/hashIds'

import { QUERY_KEYS } from './queryKeys'

type Config = {
  staleTime?: number
}

export const useUsers = (userIds: ID[], config?: Config) => {
  const { audiusSdk } = useAppContext()
  const dispatch = useDispatch()

  return useQuery({
    queryKey: [QUERY_KEYS.users, userIds],
    queryFn: async () => {
      const encodedIds = userIds
        .map(encodeHashId)
        .filter((id): id is string => id !== null)
      if (encodedIds.length === 0) return []
      const { data } = await audiusSdk!.full.users.getBulkUsers({
        id: encodedIds
      })
      const users = userMetadataListFromSDK(data)

      // Sync users data to Redux
      if (users?.length) {
        const entries: Partial<Record<Kind, EntryMap>> = {
          [Kind.USERS]: {}
        }

        users.forEach((user) => {
          entries[Kind.USERS]![user.user_id] = {
            id: user.user_id,
            metadata: user
          }
        })

        dispatch(addEntries(entries, undefined, undefined, 'react-query'))
      }

      return users
    },
    staleTime: config?.staleTime,
    enabled: !!audiusSdk && userIds.length > 0
  })
}
