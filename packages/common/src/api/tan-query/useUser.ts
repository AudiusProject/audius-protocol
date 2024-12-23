import { useQuery } from '@tanstack/react-query'

import { userMetadataListFromSDK } from '~/adapters/user'
import { useAppContext } from '~/context/appContext'
import { ID } from '~/models/Identifiers'
import { encodeHashId } from '~/utils/hashIds'

import { QUERY_KEYS } from './queryKeys'

type Config = {
  staleTime?: number
}

export const useUser = (userId: ID, config?: Config) => {
  const { audiusSdk } = useAppContext()

  return useQuery({
    queryKey: [QUERY_KEYS.user, userId],
    queryFn: async () => {
      const encodedId = encodeHashId(userId)
      if (!encodedId) return null
      const { data } = await audiusSdk!.full.users.getUser({ id: encodedId })
      return userMetadataListFromSDK(data)[0]
    },
    staleTime: config?.staleTime,
    enabled: !!audiusSdk && !!userId
  })
}
