import { Id } from '@audius/sdk'
import { useQuery } from '@tanstack/react-query'

import { useAudiusQueryContext } from '~/audius-query/AudiusQueryContext'
import { Chain, type ID } from '~/models'

import { QUERY_KEYS } from './queryKeys'
import { QueryOptions } from './types'
import { useCurrentUserId } from './useCurrentUserId'

export const getConnectedWalletsQueryKey = ({
  userId
}: {
  userId: ID | null
}) => [QUERY_KEYS.connectedWallets, userId]

export const useConnectedWallets = (options?: QueryOptions) => {
  const { audiusSdk } = useAudiusQueryContext()
  const { data: currentUserId } = useCurrentUserId()

  return useQuery({
    queryKey: getConnectedWalletsQueryKey({ userId: currentUserId }),
    queryFn: async () => {
      const sdk = await audiusSdk()
      const { data } = await sdk.users.getConnectedWallets({
        id: Id.parse(currentUserId)
      })
      return data?.ercWallets
        ?.map((address) => ({
          address,
          chain: Chain.Eth
        }))
        .concat(
          data?.splWallets?.map((address) => ({
            address,
            chain: Chain.Sol
          }))
        )
    },
    ...options
  })
}
