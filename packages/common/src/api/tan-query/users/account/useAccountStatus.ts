import { useQuery } from '@tanstack/react-query'

import { Status } from '~/models'

import { QUERY_KEYS } from '../../queryKeys'
import { QueryKey } from '../../types'

export const getAccountStatusQueryKey = () =>
  [QUERY_KEYS.accountStatus] as unknown as QueryKey<Status>

export const useAccountStatus = () => {
  return useQuery({
    queryKey: getAccountStatusQueryKey(),
    // This query data will get updated by the useCurrentAccount hook
    queryFn: () => Status.IDLE
  })
}
