import { OptionalId } from '@audius/sdk'
import { useQuery } from '@tanstack/react-query'

import { SearchResults, searchResultsFromSDK } from '~/adapters/search'
import { useAudiusQueryContext } from '~/audius-query'
import { useFeatureFlag } from '~/hooks/useFeatureFlag'
import { FeatureFlags } from '~/services/remote-config'

import { QUERY_KEYS } from './queryKeys'
import { QueryKey, QueryOptions } from './types'
import { useCurrentUserId } from './useCurrentUserId'

const DEFAULT_LIMIT = 3

type UseSearchAutocompleteArgs = {
  query: string
  limit?: number
}

export const getSearchAutocompleteQueryKey = ({
  query,
  limit = DEFAULT_LIMIT
}: UseSearchAutocompleteArgs) =>
  [QUERY_KEYS.search, query, { limit }] as unknown as QueryKey<SearchResults>

export const useSearchAutocomplete = (
  { query, limit = DEFAULT_LIMIT }: UseSearchAutocompleteArgs,
  options?: QueryOptions
) => {
  const { audiusSdk } = useAudiusQueryContext()
  const { data: currentUserId } = useCurrentUserId()
  const { isEnabled: isUSDCEnabled } = useFeatureFlag(
    FeatureFlags.USDC_PURCHASES
  )

  return useQuery({
    queryKey: getSearchAutocompleteQueryKey({ query, limit }),
    queryFn: async () => {
      const sdk = await audiusSdk()
      const { data } = await sdk.full.search.searchAutocomplete({
        userId: OptionalId.parse(currentUserId),
        query,
        limit,
        includePurchaseable: isUSDCEnabled
      })

      return searchResultsFromSDK(data)
    },
    placeholderData: (prev) => (query === '' ? undefined : prev),
    ...options,
    enabled: options?.enabled !== false && query.length > 0
  })
}
