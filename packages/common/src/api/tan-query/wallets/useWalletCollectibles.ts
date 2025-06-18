import type { CollectibleState } from '@audius/fetch-nft'
import { useQuery } from '@tanstack/react-query'

import { useQueryContext } from '~/api/tan-query/utils/QueryContext'
import { Chain } from '~/models'

import { QUERY_KEYS } from '../queryKeys'
import { QueryOptions, type QueryKey } from '../types'

type UseWalletCollectibles = {
  /** Ethereum or Solana wallet address */
  address: string
  chain: Chain
}

export const getWalletCollectiblesQueryKey = ({
  address,
  chain
}: UseWalletCollectibles) =>
  [
    QUERY_KEYS.walletCollectibles,
    chain,
    address
  ] as unknown as QueryKey<CollectibleState>

/**
 * Query function for getting the collectibles of an Ethereum or Solana wallet.
 */
export const useWalletCollectibles = (
  { address, chain }: UseWalletCollectibles,
  options?: QueryOptions
) => {
  const { nftClient } = useQueryContext()

  return useQuery({
    queryKey: getWalletCollectiblesQueryKey({ address, chain }),
    queryFn: async () => {
      if (chain === Chain.Eth) {
        return await nftClient.getEthereumCollectibles([address])
      } else {
        return await nftClient.getSolanaCollectibles([address])
      }
    },
    ...options
  })
}
