import { useQuery } from '@tanstack/react-query'

import { useSdk } from './useSdk'

type Config = {
  staleTime?: number
}

export const useUser = (userId: string, config?: Config) => {
  const { data: sdk } = useSdk()

  return useQuery({
    queryKey: ['user', userId],
    queryFn: async () => {
      const { data } = await sdk!.full.users.getUser({ id: userId })
      return data?.[0]
    },
    staleTime: config?.staleTime,
    enabled: !!sdk && !!userId
  })
}
