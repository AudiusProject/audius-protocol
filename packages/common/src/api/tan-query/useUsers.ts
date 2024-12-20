import { useQuery } from '@tanstack/react-query'

import { useAppContext } from '~/context'

import { QUERY_KEYS } from './queryKeys'

type Config = {
  staleTime?: number
}

export const useUsers = (userIds: string[], config?: Config) => {
  const { audiusSdk } = useAppContext()

  return useQuery({
    queryKey: [QUERY_KEYS.users, userIds],
    queryFn: async () => {
      const { data } = await audiusSdk!.full.users.getBulkUsers({
        id: userIds
      })
      return data
    },
    staleTime: config?.staleTime,
    enabled: !!audiusSdk && userIds.length > 0
  })
}
