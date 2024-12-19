import { useQuery } from '@tanstack/react-query'

import { audiusSdk } from 'services/audius-sdk/audiusSdk'

export const useSdk = () => {
  return useQuery({
    queryKey: ['sdk'],
    queryFn: () => audiusSdk(),
    staleTime: Infinity,
    cacheTime: Infinity
  })
}
