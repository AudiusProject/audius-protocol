import { useQuery } from '@tanstack/react-query'
import { isEmpty } from 'lodash'

import { useAudiusQueryContext } from '~/audius-query'

import { QUERY_KEYS } from './queryKeys'
import { Config } from './types'

export const useHandleInUse = (
  handle: string | null | undefined,
  config?: Config
) => {
  const { audiusSdk } = useAudiusQueryContext()

  return useQuery({
    queryKey: [QUERY_KEYS.handleInUse, handle],
    queryFn: async () => {
      if (!handle) return false
      const sdk = await audiusSdk()
      const { data: users = [] } = await sdk.full.users.getUserByHandle({
        handle
      })
      return !isEmpty(users[0])
    },
    staleTime: config?.staleTime,
    enabled: config?.enabled !== false && !!handle
  })
}
