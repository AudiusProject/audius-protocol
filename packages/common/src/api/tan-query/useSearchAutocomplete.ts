import { OptionalId } from '@audius/sdk'
import { useQuery } from '@tanstack/react-query'

import { searchResultsFromSDK } from '~/adapters/search'
import { useAudiusQueryContext } from '~/audius-query'
import { useFeatureFlag } from '~/hooks/useFeatureFlag'
import { UserCollectionMetadata } from '~/models/Collection'
import { UserTrackMetadata } from '~/models/Track'
import { User } from '~/models/User'
import { FeatureFlags } from '~/services/remote-config'

import { QUERY_KEYS } from './queryKeys'
import { QueryOptions } from './types'
import { useCurrentUserId } from './useCurrentUserId'

const DEFAULT_LIMIT = 3

type UseSearchAutocompleteArgs = {
  query: string
  limit?: number
}

type SearchResults = {
  tracks: UserTrackMetadata[]
  albums: UserCollectionMetadata[]
  playlists: UserCollectionMetadata[]
  users: User[]
}

const limitAutocompleteResults = (results: SearchResults): SearchResults => {
  const { tracks, albums, playlists, users } = results
  return {
    tracks: tracks.slice(0, DEFAULT_LIMIT),
    albums: albums.slice(0, DEFAULT_LIMIT),
    playlists: playlists.slice(0, DEFAULT_LIMIT),
    users: users.slice(0, DEFAULT_LIMIT)
  }
}

export const getSearchAutocompleteQueryKey = ({
  query,
  limit = DEFAULT_LIMIT
}: UseSearchAutocompleteArgs) => [QUERY_KEYS.search, query, { limit }]

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
        offset: 0,
        includePurchaseable: isUSDCEnabled
      })

      return limitAutocompleteResults(searchResultsFromSDK(data))
    },
    staleTime: options?.staleTime,
    enabled: options?.enabled !== false && query.length > 0,
    placeholderData: (prev) => (query === '' ? undefined : prev)
  })
}
