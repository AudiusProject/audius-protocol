import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useDispatch, useSelector } from 'react-redux'

import { userMetadataListFromSDK } from '~/adapters/user'
import { useAppContext } from '~/context/appContext'
import { OptionalId } from '~/models/Identifiers'
import { Kind } from '~/models/Kind'
import { accountSelectors } from '~/store/account'
import { addEntries } from '~/store/cache/actions'
import { EntriesByKind } from '~/store/cache/types'

import { QUERY_KEYS } from './queryKeys'
import { QueryOptions } from './types'

export const useUserByHandle = (
  handle: string | undefined,
  options?: QueryOptions
) => {
  const { audiusSdk } = useAppContext()
  const dispatch = useDispatch()
  const queryClient = useQueryClient()
  const currentUserId = useSelector(accountSelectors.getUserId)

  return useQuery({
    queryKey: [QUERY_KEYS.userByHandle, handle],
    queryFn: async () => {
      if (!handle) return null
      const { data } = await audiusSdk!.full.users.getUserByHandle({
        handle,
        userId: OptionalId.parse(currentUserId)
      })
      const user = userMetadataListFromSDK(data)[0]

      // Prime the user query cache with user data
      if (user) {
        queryClient.setQueryData([QUERY_KEYS.user, user.user_id], user)

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
    enabled: options?.enabled !== false && !!audiusSdk && !!handle
  })
}
