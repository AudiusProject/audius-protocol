import { useQuery } from '@tanstack/react-query'

import { useAudiusQueryContext } from '~/audius-query/AudiusQueryContext'
import { Chain } from '~/models'

import { QUERY_KEYS } from './queryKeys'
import { QueryOptions } from './types'

type UseWalletCollectibles = {
  /** Ethereum or Solana wallet address */
  address: string
  chain: Chain
}

export const getCollectiblesQueryKey = ({
  address,
  chain
}: UseWalletCollectibles) => [QUERY_KEYS.walletCollectibles, chain, address]

/**
 * Query function for getting the AUDIO balance of an Ethereum wallet.
 */
export const useWalletCollectibles = (
  { address, chain }: UseWalletCollectibles,
  options?: QueryOptions
) => {
  const { nftClient } = useAudiusQueryContext()

  return useQuery({
    queryKey: getCollectiblesQueryKey({ address, chain }),
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
