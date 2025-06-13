import { useQuery } from '@tanstack/react-query'

import { QUERY_KEYS, QueryKey } from '~/api'

type WalletAddresses = {
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
    queryKey: [QUERY_KEYS.walletAddresses],
    // This should always be set whenever the account is loaded in fetchAccountAsync saga
    // This queryFn ideally should never run
    queryFn: () => ({ currentUser: null, web3User: null }),
    staleTime: Infinity,
    gcTime: Infinity
  })
}
