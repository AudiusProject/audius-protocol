import { useQuery } from '@tanstack/react-query'
import { useDispatch, useSelector } from 'react-redux'

import { userMetadataListFromSDK } from '~/adapters/user'
import { useAppContext } from '~/context/appContext'
import { Id, ID, OptionalId } from '~/models/Identifiers'
import { Kind } from '~/models/Kind'
import { accountSelectors } from '~/store/account'
import { addEntries } from '~/store/cache/actions'
import { EntriesByKind } from '~/store/cache/types'

import { QUERY_KEYS } from './queryKeys'

type Config = {
  staleTime?: number
  enabled?: boolean
}

export const useUser = (userId: ID | undefined, config?: Config) => {
  const { audiusSdk } = useAppContext()
  const dispatch = useDispatch()
  const currentUserId = useSelector(accountSelectors.getUserId)

  return useQuery({
    queryKey: [QUERY_KEYS.user, userId],
    queryFn: async () => {
      const { data } = await audiusSdk!.full.users.getUser({
        id: Id.parse(userId),
        userId: OptionalId.parse(currentUserId)
      })
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
    enabled: config?.enabled !== false && !!audiusSdk && !!userId
  })
}
