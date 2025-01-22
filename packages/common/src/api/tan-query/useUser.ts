import { Id } from '@audius/sdk'
import { useQuery } from '@tanstack/react-query'
import { useDispatch } from 'react-redux'

import { userMetadataListFromSDK } from '~/adapters/user'
import { useAppContext } from '~/context/appContext'
import { ID } from '~/models/Identifiers'
import { Kind } from '~/models/Kind'
import { addEntries } from '~/store/cache/actions'
import { EntriesByKind } from '~/store/cache/types'

import { QUERY_KEYS } from './queryKeys'

type Config = {
  staleTime?: number
}

export const useUser = (userId: ID, config?: Config) => {
  const { audiusSdk } = useAppContext()
  const dispatch = useDispatch()

  return useQuery({
    queryKey: [QUERY_KEYS.user, userId],
    queryFn: async () => {
      const encodedId = Id.parse(userId)
      if (!encodedId) return null
      const { data } = await audiusSdk!.full.users.getUser({ id: encodedId })
      const user = userMetadataListFromSDK(data)[0]

      // Sync user data to Redux
      if (user) {
        const entries: EntriesByKind = {
          [Kind.USERS]: {
            [user.user_id]: user
          }
        }

        dispatch(addEntries(entries, undefined, undefined, 'react-query'))
      }

      return user
    },
    staleTime: config?.staleTime,
    enabled: !!audiusSdk && !!userId
  })
}
