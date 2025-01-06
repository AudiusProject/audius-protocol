import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useDispatch, useSelector } from 'react-redux'

import { userMetadataListFromSDK } from '~/adapters/user'
import { useAppContext } from '~/context/appContext'
import { Id, ID, OptionalId } from '~/models/Identifiers'
import { Kind } from '~/models/Kind'
import { getUserId } from '~/store/account/selectors'
import { addEntries } from '~/store/cache/actions'
import { EntriesByKind } from '~/store/cache/types'

import { QUERY_KEYS } from './queryKeys'
import { QueryOptions } from './types'

export const useUser = (
  userId: ID | null | undefined,
  options?: QueryOptions
) => {
  const { audiusSdk } = useAppContext()
  const dispatch = useDispatch()
  const queryClient = useQueryClient()
  const currentUserId = useSelector(getUserId)

  return useQuery({
    queryKey: [QUERY_KEYS.user, userId],
    queryFn: async () => {
      const { data } = await audiusSdk!.full.users.getUser({
        id: Id.parse(userId),
        userId: OptionalId.parse(currentUserId)
      })
      const user = userMetadataListFromSDK(data)[0]

      // Prime both user and userByHandle caches
      if (user) {
        queryClient.setQueryData([QUERY_KEYS.userByHandle, user.handle], user)

        // Sync user data to Redux
        const entries: EntriesByKind = {
          [Kind.USERS]: {
            [user.user_id]: user
          }
        }

        dispatch(addEntries(entries, undefined, undefined, 'react-query'))
      }

      return user
    },
    staleTime: options?.staleTime,
    enabled: options?.enabled !== false && !!audiusSdk && !!userId
  })
}
