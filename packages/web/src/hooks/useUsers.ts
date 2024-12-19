import { useQuery } from '@tanstack/react-query'

import { useSdk } from './useSdk'

type Config = {
  staleTime?: number
}

export const useUsers = (userIds: string[], config?: Config) => {
  const { data: sdk } = useSdk()

  return useQuery({
    queryKey: ['users', userIds],
    queryFn: async () => {
      const { data } = await sdk!.full.users.getBulkUsers({
        id: userIds
      })
      return data
    },
    staleTime: config?.staleTime,
    enabled: !!sdk && userIds.length > 0
  })
}
