import { useQuery } from '@tanstack/react-query'

import { QUERY_KEYS, QueryKey } from '~/api'

export type WalletAddresses = {
  currentUser: string | null
  web3User: string | null
}

export const getWalletAddressesQueryKey = () =>
  [
    QUERY_KEYS.account,
    QUERY_KEYS.walletAddresses
  ] as unknown as QueryKey<WalletAddresses>

export const useWalletAddresses = () => {
  return useQuery<WalletAddresses>({
    queryKey: getWalletAddressesQueryKey(),
    // This data should always be set by the fetchAccountAsync saga
    // So think of this queryFn as the "initial value"
    // TODO: refactor the fetchAccountAsync saga to overlap with this queryFn more
    queryFn: () => ({ currentUser: null, web3User: null }),
    staleTime: Infinity,
    gcTime: Infinity
  })
}
