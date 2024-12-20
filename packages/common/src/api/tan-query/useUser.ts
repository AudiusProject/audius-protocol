import { useQuery } from '@tanstack/react-query'

import { useAppContext } from '~/context'

import { QUERY_KEYS } from './queryKeys'

type Config = {
  staleTime?: number
}

export const useUser = (userId: string, config?: Config) => {
  const { audiusSdk } = useAppContext()

  return useQuery({
    queryKey: [QUERY_KEYS.user, userId],
    queryFn: async () => {
      const { data } = await audiusSdk!.full.users.getUser({ id: userId })
      return data?.[0]
    },
    staleTime: config?.staleTime,
    enabled: !!audiusSdk && !!userId
  })
}
