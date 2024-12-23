import { useQuery } from '@tanstack/react-query'

import { userMetadataListFromSDK } from '~/adapters/user'
import { useAppContext } from '~/context/appContext'
import { ID } from '~/models/Identifiers'
import { encodeHashId } from '~/utils/hashIds'

import { QUERY_KEYS } from './queryKeys'

type Config = {
  staleTime?: number
}

export const useUsers = (userIds: ID[], config?: Config) => {
  const { audiusSdk } = useAppContext()

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
      return userMetadataListFromSDK(data)
    },
    staleTime: config?.staleTime,
    enabled: !!audiusSdk && userIds.length > 0
  })
}
